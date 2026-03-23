const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getMessages } = require('../controllers/messageController');

router.get('/:bookingId', protect, getMessages);

module.exports = router;
