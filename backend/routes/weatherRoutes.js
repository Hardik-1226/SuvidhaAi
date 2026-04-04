const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * @desc    Get real-time weather using Open-Meteo
 * @route   GET /api/weather
 * @access  Public
 */

// ── Cache & deduplication ────────────────────────────────────────────
const weatherCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes (was 15, increased to reduce calls)

// Track in-flight requests so duplicate callers share one promise
const inFlightRequests = new Map();

// Rate limiting: track request timestamps per IP
const ipRequestLog = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // max 5 weather requests per minute per IP

// Global rate limiter for Open-Meteo calls
let lastOpenMeteoCall = 0;
const MIN_CALL_INTERVAL = 2000; // minimum 2s between Open-Meteo API calls

/**
 * Fetch weather with retry + exponential backoff
 */
async function fetchWeatherWithRetry(lat, lon, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Enforce minimum interval between Open-Meteo calls
      const now = Date.now();
      const timeSinceLast = now - lastOpenMeteoCall;
      if (timeSinceLast < MIN_CALL_INTERVAL) {
        await new Promise(r => setTimeout(r, MIN_CALL_INTERVAL - timeSinceLast));
      }
      lastOpenMeteoCall = Date.now();

      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
        { timeout: 5000 }
      );
      return weatherRes.data.current_weather;
    } catch (err) {
      if (err.response?.status === 429 && attempt < retries - 1) {
        // Exponential backoff: 2s, 4s, 8s…
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(`⚠️ Open-Meteo 429 — retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    // ── Per-IP rate limiting ───────────────────────────────────────
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const ipLog = ipRequestLog.get(clientIP) || [];
    // Remove entries outside window
    const recentRequests = ipLog.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      // Return cached data if available, otherwise fallback
      const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
      const cached = weatherCache.get(cacheKey);
      if (cached) {
        return res.json(buildResponse(cached.data));
      }
      return res.status(429).json({
        success: false,
        message: 'Too many weather requests. Please wait a moment.',
      });
    }
    recentRequests.push(now);
    ipRequestLog.set(clientIP, recentRequests);

    // ── Caching logic ──────────────────────────────────────────────
    const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
    let currentWeather;
    let fromCache = false;

    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (Date.now() - cached.time < CACHE_TTL) {
        currentWeather = cached.data;
        fromCache = true;
      }
    }

    if (!fromCache) {
      // Deduplicate: if another request for the same key is already in flight, wait for it
      if (inFlightRequests.has(cacheKey)) {
        try {
          currentWeather = await inFlightRequests.get(cacheKey);
        } catch {
          currentWeather = getFallbackWeather();
        }
      } else {
        const fetchPromise = fetchWeatherWithRetry(lat, lon);
        inFlightRequests.set(cacheKey, fetchPromise);

        try {
          currentWeather = await fetchPromise;
          weatherCache.set(cacheKey, { data: currentWeather, time: Date.now() });
        } catch (weatherErr) {
          console.warn('⚠️ Weather API failed. Using fallback weather.', weatherErr.message);
          currentWeather = getFallbackWeather();
        } finally {
          inFlightRequests.delete(cacheKey);
        }
      }
    }

    res.json(buildResponse(currentWeather));
  } catch (error) {
    console.error('Weather fetching error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
  }
});

// ── Helpers ────────────────────────────────────────────────────────

function getFallbackWeather() {
  return { temperature: 25, weathercode: 1, windspeed: 10, is_day: 1 };
}

function wmoToCondition(wmo) {
  if (wmo >= 95) return 'Thunderstorm';
  if (wmo >= 80 && wmo <= 82) return 'Rain Showers';
  if (wmo >= 71 && wmo <= 77) return 'Snow';
  if (wmo >= 51 && wmo <= 67) return 'Rain';
  if (wmo >= 45 && wmo <= 48) return 'Fog';
  if (wmo >= 1 && wmo <= 3) return 'Cloudy';
  return 'Clear';
}

function buildResponse(currentWeather) {
  const condition = wmoToCondition(currentWeather.weathercode);

  // AI recommendation — attempt inline, but don't block on failure
  // This is now done lazily client-side or cached separately
  return {
    success: true,
    data: {
      temperature: currentWeather.temperature,
      condition,
      windspeed: currentWeather.windspeed,
      isDay: currentWeather.is_day === 1,
      recommendedServices: getStaticWeatherRecommendations(condition, currentWeather.temperature),
    },
  };
}

/**
 * Static weather-based recommendations (no AI call needed).
 * This eliminates the cascading 429 from calling the AI service
 * on every weather request. The AI service is called only for
 * demand prediction, not for simple category suggestions.
 */
function getStaticWeatherRecommendations(condition, temperature) {
  const recs = [];

  if (condition.includes('Rain') || condition.includes('Thunder') || condition.includes('Showers')) {
    recs.push('plumber', 'electrician', 'roof repair');
  } else if (condition === 'Snow') {
    recs.push('plumber', 'electrician');
  } else if (temperature > 35) {
    recs.push('ac repair', 'electrician', 'plumber');
  } else if (temperature > 30) {
    recs.push('ac repair', 'electrician');
  } else if (condition === 'Clear' && temperature >= 20 && temperature <= 30) {
    recs.push('painter', 'carpenter', 'cleaner');
  } else if (condition === 'Cloudy') {
    recs.push('cleaner', 'tutor', 'carpenter');
  } else if (condition === 'Fog') {
    recs.push('electrician', 'mechanic');
  }

  // Always return at least some recs
  if (recs.length === 0) recs.push('cleaner', 'tutor');

  return recs;
}

// ── Periodic cleanup of IP rate-limit log to prevent memory leak ───
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [ip, timestamps] of ipRequestLog.entries()) {
    const filtered = timestamps.filter(ts => ts > cutoff);
    if (filtered.length === 0) ipRequestLog.delete(ip);
    else ipRequestLog.set(ip, filtered);
  }
}, RATE_LIMIT_WINDOW);

// ── Periodic cleanup of stale cache entries ────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.time > CACHE_TTL) weatherCache.delete(key);
  }
}, CACHE_TTL);

module.exports = router;
