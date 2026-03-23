/**
 * Service Controller
 * Handles browsing, searching, filtering, and CRUD for services
 * Supports geospatial queries by distance
 */

const axios = require('axios');
const Service = require('../models/Service');
const Provider = require('../models/Provider');

/**
 * @desc    Get all services with optional filters (distance, rating, price, category)
 * @route   GET /api/services
 * @access  Public
 */
exports.getServices = async (req, res, next) => {
  try {
    const { category, lat, lon, maxDistance = 20000, minPrice, maxPrice, sortBy, providerId } = req.query;

    let query = { isActive: true };
    if (providerId) query.provider = providerId;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Geospatial filter — nearby services within `maxDistance` meters
    if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      query.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    let services = Service.find(query).populate({
      path: 'provider',
      select: 'ratings isAvailable category pricePerHour location',
      populate: { path: 'user', select: 'name avatar' },
    });

    // Sort options
    if (sortBy === 'price_asc') services = services.sort({ price: 1 });
    else if (sortBy === 'price_desc') services = services.sort({ price: -1 });
    else if (sortBy === 'rating') services = services.sort({ 'provider.ratings.average': -1 });

    const results = await services.limit(50);

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate({
      path: 'provider',
      populate: { path: 'user', select: 'name avatar phone email' },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new service (Provider only)
 * @route   POST /api/services
 * @access  Private (provider)
 */
exports.createService = async (req, res, next) => {
  try {
    // Find provider profile for logged-in user
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) {
      return res.status(403).json({ success: false, message: 'Only providers can create services' });
    }

    const service = await Service.create({
      ...req.body,
      provider: provider._id,
      location: req.body.location || provider.location,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a service (Provider must own it)
 * @route   PUT /api/services/:id
 * @access  Private (provider)
 */
exports.updateService = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    const service = await Service.findById(req.params.id);

    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (!provider || service.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this service' });
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a service
 * @route   DELETE /api/services/:id
 * @access  Private (provider or admin)
 */
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI-predicted demand for a service category
 * @route   GET /api/services/demand?category=&lat=&lon=
 * @access  Public
 */
exports.getServiceDemand = async (req, res, next) => {
  try {
    const { category, lat, lon } = req.query;

    // Fetch current weather to provide context to the AI model
    let temperature = 25;
    let weather = 'Clear';

    if (lat && lon) {
      try {
        const weatherRes = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        temperature = weatherRes.data.current_weather.temperature;
        // WMO code mapping (simplified for predictor)
        const wmo = weatherRes.data.current_weather.weathercode;
        if (wmo >= 51) weather = 'Rain';
        else if (wmo >= 1) weather = 'Cloudy';
      } catch (err) {
        console.warn('Weather fetch failed for demand prediction, using defaults');
      }
    }

    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 6) timeOfDay = 'night';

    const dayOfWeek = now.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();

    // Call AI Demand Predictor
    try {
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/predict-demand`, {
        service: category || 'plumber',
        temperature,
        weather,
        time: timeOfDay,
        day: dayOfWeek,
      });

      res.json({
        success: true,
        demandScore: aiRes.data.demand_score,
        context: { temperature, weather, timeOfDay, dayOfWeek },
      });
    } catch (aiErr) {
      console.error('AI Demand Prediction failed:', aiErr.message);
      res.json({
        success: true,
        demandScore: 0.5, // Default/Neutral
        message: 'AI Service currently unavailable',
      });
    }
  } catch (error) {
    next(error);
  }
};
