/**
 * Review Model
 * Stores user reviews for providers after a completed booking
 * isGenuine is flagged by the AI fake review detector
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // AI-powered fake review detection result
    aiLabel: {
      type: String,
      enum: ['genuine', 'suspicious', 'unchecked'],
      default: 'unchecked',
    },
    aiConfidence: {
      type: Number, // Float 0–1 confidence from AI model
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true, // Admin can hide suspicious reviews
    },
  },
  { timestamps: true }
);

// One review per booking per user — sparse so booking:null doesn't conflict
ReviewSchema.index({ user: 1, booking: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ provider: 1 });

// After a review is saved, update the provider's average rating
ReviewSchema.post('save', async function () {
  try {
    const Provider = require('./Provider');
    const stats = await mongoose
      .model('Review')
      .aggregate([
        { $match: { provider: this.provider, isVisible: true } },
        {
          $group: {
            _id: '$provider',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

    if (stats.length > 0) {
      await Provider.findByIdAndUpdate(this.provider, {
        'ratings.average': Math.round(stats[0].avgRating * 10) / 10,
        'ratings.count': stats[0].count,
      });
    }
  } catch (err) {
    console.error('Error updating provider rating:', err);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
