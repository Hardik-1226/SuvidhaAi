/**
 * Admin Controller
 * Platform management: view users, providers, flag/remove listings
 */

const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) { next(error); }
};

/**
 * @desc    Deactivate / activate a user
 * @route   PATCH /api/admin/users/:id/toggle
 * @access  Private (admin)
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (error) { next(error); }
};

/**
 * @desc    Delete a service listing (spam removal)
 * @route   DELETE /api/admin/listings/:id
 * @access  Private (admin)
 */
exports.removeListing = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Listing removed' });
  } catch (error) { next(error); }
};

/**
 * @desc    Get platform analytics summary
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
exports.getStats = async (req, res, next) => {
  try {
    const [users, providers, services, bookings, reviews] = await Promise.all([
      User.countDocuments(),
      Provider.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);

    const revenue = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: users,
        totalProviders: providers,
        totalServices: services,
        totalBookings: bookings,
        totalReviews: reviews,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) { next(error); }
};

/**
 * @desc    Get all providers (for management)
 * @route   GET /api/admin/providers
 * @access  Private (admin)
 */
exports.getProviders = async (req, res, next) => {
  try {
    const providers = await Provider.find().populate('user', 'name email isActive').sort({ createdAt: -1 });
    res.json({ success: true, count: providers.length, data: providers });
  } catch (error) { next(error); }
};

/**
 * @desc    Verify a provider (mark as verified)
 * @route   PATCH /api/admin/providers/:id/verify
 * @access  Private (admin)
 */
exports.verifyProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (error) { next(error); }
};

/**
 * @desc    Hide a suspicious review
 * @route   PATCH /api/admin/reviews/:id/hide
 * @access  Private (admin)
 */
exports.hideReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isVisible: false }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review hidden' });
  } catch (error) { next(error); }
};
