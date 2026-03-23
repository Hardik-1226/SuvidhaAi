const Message = require('../models/Message');

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ booking: req.params.bookingId }).sort('createdAt');
    const formatted = messages.map(m => ({
      _id: m._id,
      senderId: m.sender,
      senderName: m.senderName,
      message: m.message,
      timestamp: m.createdAt,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
