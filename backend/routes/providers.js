// Provider routes: profile, availability, recommendations
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorize } = require('../middleware/adminOnly');
const {
  getRecommendations,
  getMyProfile,
  getProvider,
  toggleAvailability,
  updateProfile,
} = require('../controllers/providerController');

router.get('/recommend', getRecommendations);
router.get('/me', protect, authorize('provider'), getMyProfile);
router.put('/me', protect, authorize('provider'), updateProfile);
router.patch('/availability', protect, authorize('provider'), toggleAvailability);
router.get('/:id', getProvider);

module.exports = router;
