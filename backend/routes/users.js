// User routes
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users/profile - get own profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/users/profile - update own profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;
