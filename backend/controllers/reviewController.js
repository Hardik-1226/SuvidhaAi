/**
 * Review Controller
 * Creates reviews, runs AI fake-review detection, and fetches provider reviews
 */

const axios = require('axios');
const Review = require('../models/Review');
const Provider = require('../models/Provider');

/**
 * @desc    Submit a review for a provider (calls AI service to check authenticity)
 * @route   POST /api/reviews
 * @access  Private (user)
 */
exports.createReview = async (req, res, next) => {
  try {
    const { providerId, bookingId, rating, comment } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    // Call AI microservice to check if review is genuine
    let aiLabel = 'unchecked';
    let aiConfidence = 0;
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/review-check`, { review: comment });
      aiLabel = aiResponse.data.label;
      aiConfidence = aiResponse.data.confidence;
    } catch (aiError) {
      console.warn('⚠️  AI service unavailable — skipping fake review detection');
    }

    const review = await Review.create({
      user: req.user._id,
      provider: providerId,
      booking: bookingId,
      rating,
      comment,
      aiLabel,
      aiConfidence,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for a provider
 * @route   GET /api/reviews/provider/:providerId
 * @access  Public
 */
exports.getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId,
      isVisible: true,
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};
