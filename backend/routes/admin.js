// Admin routes (all protected + admin-only)
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const {
  getUsers,
  toggleUserStatus,
  removeListing,
  getStats,
  getProviders,
  verifyProvider,
  hideReview,
} = require('../controllers/adminController');

router.use(protect, adminOnly); // All admin routes require auth + admin role

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/providers', getProviders);
router.patch('/providers/:id/verify', verifyProvider);
router.delete('/listings/:id', removeListing);
router.patch('/reviews/:id/hide', hideReview);

module.exports = router;
