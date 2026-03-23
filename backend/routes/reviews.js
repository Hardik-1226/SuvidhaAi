// Review routes
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { createReview, getProviderReviews } = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/provider/:providerId', getProviderReviews);

module.exports = router;
