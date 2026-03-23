const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * @desc    Get real-time weather using Open-Meteo
 * @route   GET /api/weather
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    // Open-Meteo free API - no key needed
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    
    const currentWeather = weatherRes.data.current_weather;
    
    // Convert WMO Weather code to readable condition
    const wmo = currentWeather.weathercode;
    let condition = "Clear";
    if (wmo >= 1 && wmo <= 3) condition = "Cloudy";
    else if (wmo >= 45 && wmo <= 48) condition = "Fog";
    else if (wmo >= 51 && wmo <= 67) condition = "Rain";
    else if (wmo >= 71 && wmo <= 77) condition = "Snow";
    else if (wmo >= 80 && wmo <= 82) condition = "Rain Showers";
    else if (wmo >= 95) condition = "Thunderstorm";

    // 2. Query Python AI Service for Demand Recommendations
    let recommendedServices = [];
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/weather-recommendation`, {
        temperature: currentWeather.temperature,
        weather: condition
      });
      if (aiResponse.data && aiResponse.data.recommended_services) {
        recommendedServices = aiResponse.data.recommended_services;
      }
    } catch (aiErr) {
      console.warn('⚠️ AI Service unavailable for weather recommendations');
    }

    res.json({
      success: true,
      data: {
        temperature: currentWeather.temperature,
        condition,
        windspeed: currentWeather.windspeed,
        isDay: currentWeather.is_day === 1,
        recommendedServices
      }
    });

  } catch (error) {
    console.error('Weather fetching error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
  }
});

module.exports = router;
