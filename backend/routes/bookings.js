// Booking routes
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  updateBookingStatus,
  getBooking,
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/me', protect, getMyBookings);
router.get('/provider', protect, getProviderBookings);
router.get('/:id', protect, getBooking);
router.patch('/:id', protect, updateBookingStatus);

module.exports = router;
