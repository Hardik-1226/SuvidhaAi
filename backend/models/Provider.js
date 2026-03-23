/**
 * Provider Model
 * Extends User with provider-specific fields:
 * services offered, availability, ratings, earnings
 */

const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: [
        'plumber',
        'electrician',
        'carpenter',
        'tutor',
        'cleaner',
        'painter',
        'mechanic',
        'doctor',
        'other',
      ],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    experience: {
      type: Number, // years of experience
      default: 0,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0, 'Price cannot be negative'],
    },
    // GeoJSON location for geospatial search
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
      city: String,
    },
    isAvailable: {
      type: Boolean,
      default: true, // Provider can toggle online/offline
    },
    isVerified: {
      type: Boolean,
      default: false, // Admin verifies providers
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    // Availability schedule (optional structured data)
    availability: [
      {
        day: {
          type: String,
          enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
        startTime: String,
        endTime: String,
      },
    ],
    documents: [String], // URLs for uploaded credentials/certifications
  },
  { timestamps: true }
);

// Geospatial index for $nearSphere queries
ProviderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', ProviderSchema);
