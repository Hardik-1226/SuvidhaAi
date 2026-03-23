// Service routes: browse, search, CRUD
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorize } = require('../middleware/adminOnly');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');

router.route('/')
  .get(getServices)
  .post(protect, authorize('provider'), createService);

router.route('/:id')
  .get(getService)
  .put(protect, authorize('provider', 'admin'), updateService)
  .delete(protect, authorize('provider', 'admin'), deleteService);

module.exports = router;
