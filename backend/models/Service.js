/**
 * Service Model
 * Represents a specific service offering by a provider
 * Linked to a Provider and contains pricing, description, and location
 */

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: true,
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
      required: [true, 'Service description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceType: {
      type: String,
      enum: ['hourly', 'fixed'],
      default: 'hourly',
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    // GeoJSON for location-based search on services
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
    images: [String], // Image URLs for the service
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String], // e.g., ['urgent', 'certified', 'home-visit']
  },
  { timestamps: true }
);

ServiceSchema.index({ location: '2dsphere' });
ServiceSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
