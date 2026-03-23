/**
 * Authentication Controller
 * Handles user/provider registration and login
 * Returns JWT on successful authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Send token response helper
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Only allow 'user' and 'provider' roles from public registration
    const allowedRoles = ['user', 'provider'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, phone, role: userRole });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register as a service provider (creates User + Provider profile)
 * @route   POST /api/auth/register-provider
 * @access  Public
 */
exports.registerProvider = async (req, res, next) => {
  try {
    const { name, email, password, phone, category, pricePerHour, description, experience, location } = req.body;

    // Create the base User
    const user = await User.create({ name, email, password, phone, role: 'provider', location });

    // Create the Provider profile linked to the User
    const provider = await Provider.create({
      user: user._id,
      category,
      pricePerHour,
      description,
      experience,
      location: location || { type: 'Point', coordinates: [0, 0] },
    });

    // Auto-create an initial Service for this Provider
    await Service.create({
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Services by ${name.split(' ')[0]}`,
      category,
      description,
      price: pricePerHour,
      priceType: 'hourly',
      provider: provider._id,
      location: provider.location,
      isActive: true,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login existing user/provider/admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Explicitly select password (hidden by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
