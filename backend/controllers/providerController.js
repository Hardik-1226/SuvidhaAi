/**
 * Provider Controller
 * Handles provider profiles, availability toggle, and AI-powered recommendations
 */

const axios = require('axios');
const Provider = require('../models/Provider');
const User = require('../models/User');

/**
 * @desc    Get AI-recommended providers based on user location + category
 * @route   GET /api/providers/recommend?lat=&lon=&category=
 * @access  Public
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const { lat, lon, category } = req.query;

    // Fetch providers nearby for the category
    let filter = { isAvailable: true };
    if (category) filter.category = category;
    if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: 30000, // 30 km radius
        },
      };
    }

    const providers = await Provider.find(filter)
      .populate('user', 'name avatar email phone')
      .limit(20);

    if (!providers.length) {
      return res.json({ success: true, data: [] });
    }

    // Call AI microservice for scored recommendations
    try {
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/recommend`, {
        user_lat: parseFloat(lat) || 0,
        user_lon: parseFloat(lon) || 0,
        category: category || 'any',
        providers: providers.map((p) => ({
          id: p._id.toString(),
          lat: p.location.coordinates[1],
          lon: p.location.coordinates[0],
          rating: p.ratings.average,
          isAvailable: p.isAvailable,
          completedJobs: p.completedJobs || 0,
        })),
      });

      // Map scores back to provider objects
      const scoreMap = {};
      (aiRes.data.recommendations || []).forEach((r) => {
        scoreMap[r.id] = r.score;
      });

      const ranked = providers
        .map((p) => ({ ...p.toObject(), aiScore: scoreMap[p._id.toString()] || 0 }))
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 5);

      return res.json({ success: true, data: ranked });
    } catch (aiErr) {
      console.warn('⚠️  AI service unavailable — returning raw results:', aiErr.message);
      if (aiErr.response) {
        console.warn('   AI Response Status:', aiErr.response.status);
        console.warn('   AI Response Data:', aiErr.response.data);
      }
      return res.json({ success: true, data: providers.slice(0, 5) });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get provider profile by user ID
 * @route   GET /api/providers/me
 * @access  Private (provider)
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id }).populate('user', 'name email phone avatar');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get provider profile by ID
 * @route   GET /api/providers/:id
 * @access  Public
 */
exports.getProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('user', 'name email phone avatar');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle provider online/offline availability
 * @route   PATCH /api/providers/availability
 * @access  Private (provider)
 */
exports.toggleAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    provider.isAvailable = !provider.isAvailable;
    await provider.save();

    res.json({
      success: true,
      message: `You are now ${provider.isAvailable ? 'online' : 'offline'}`,
      isAvailable: provider.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update provider profile
 * @route   PUT /api/providers/me
 * @access  Private (provider)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email phone avatar');

    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};
