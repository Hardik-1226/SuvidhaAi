/**
 * Booking Controller
 * Manages booking lifecycle: create, accept/reject, complete, cancel
 * Integrates with provider earnings on completion
 */

const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Service = require('../models/Service');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (user)
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, scheduledAt, duration = 1, address, notes, paymentMethod, weatherContext } = req.body;

    const service = await Service.findById(serviceId).populate('provider');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    const totalPrice = service.price * duration;

    const booking = await Booking.create({
      user: req.user._id,
      provider: service.provider._id,
      service: service._id,
      scheduledAt,
      duration,
      totalPrice,
      address,
      notes,
      payment: { method: paymentMethod || 'cash' },
      weatherContext,
    });

    const populated = await booking.populate([
      { path: 'service', select: 'title category' },
      { path: 'provider', populate: { path: 'user', select: 'name phone' } },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings for the logged in user
 * @route   GET /api/bookings/me
 * @access  Private (user)
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'title category price')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings assigned to a provider
 * @route   GET /api/bookings/provider
 * @access  Private (provider)
 */
exports.getProviderBookings = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(403).json({ success: false, message: 'Provider profile not found' });

    const bookings = await Booking.find({ provider: provider._id })
      .populate('service', 'title category price')
      .populate('user', 'name phone avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status (accept/reject/complete/cancel)
 * @route   PATCH /api/bookings/:id
 * @access  Private
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const provider = await Provider.findOne({ user: req.user._id });

    // Authorize: provider can accept/reject/complete; user can cancel
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isUser = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isProvider && !isUser && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = status;
    if (status === 'completed') {
      booking.completedAt = new Date();
      booking.payment.status = 'paid';
      booking.payment.paidAt = new Date();
      // Update provider earnings
      if (provider) {
        provider.totalEarnings += booking.totalPrice;
        provider.completedJobs += 1;
        await provider.save();
      }
    }
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason;
    }

    await booking.save();
    
    // Dispatch real-time notification
    const io = req.app.get('io');
    if (io) {
      if (['accepted', 'rejected'].includes(status)) {
        io.to(booking.user.toString()).emit('notification', {
          title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your previous booking has been ${status}.`
        });
      } else if (status === 'cancelled' && provider) {
        io.to(provider.user.toString()).emit('notification', {
          title: 'Booking Cancelled',
          message: `A customer cancelled their booking.`
        });
      }
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title category price')
      .populate('user', 'name email phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
