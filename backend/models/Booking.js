/**
 * Booking Model
 * Represents a service booking made by a user with a provider
 * Tracks status lifecycle: pending → accepted/rejected → completed
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
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
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
    },
    duration: {
      type: Number, // estimated duration in hours
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    address: {
      type: String,
      required: [true, 'Service address is required'],
    },
    notes: {
      type: String, // Special instructions from user
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Payment details (simplified for demo)
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
      },
      method: {
        type: String,
        enum: ['cash', 'online'],
        default: 'cash',
      },
      paidAt: Date,
    },
    // Automatically set when booking is completed
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    
    // ML Feature Training Context
    weatherContext: {
      temperature: Number,
      condition: String
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
