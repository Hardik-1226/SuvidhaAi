/**
 * Socket.io Real-time Chat Handler
 * Creates per-booking chat rooms for user ↔ provider communication
 * Each room is keyed by bookingId to isolate conversations
 */

const Message = require('../models/Message');
const Booking = require('../models/Booking');

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user to their own personal room for global notifications
    socket.on('authenticate', (userId) => {
      socket.join(userId);
      console.log(`✅ User ${userId} authenticated for global notifications`);
    });

    socket.on('join_room', ({ bookingId, userId, userName }) => {
      socket.join(bookingId);
      console.log(`👤 ${userName} joined room: ${bookingId}`);

      socket.to(bookingId).emit('user_joined', {
        userId,
        userName,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('send_message', async ({ bookingId, senderId, senderName, message }) => {
      try {
        const newMessage = await Message.create({
          booking: bookingId,
          sender: senderId,
          senderName,
          message,
        });

        const msgPayload = {
          senderId,
          senderName,
          message,
          timestamp: newMessage.createdAt || new Date().toISOString(),
        };

        io.to(bookingId).emit('receive_message', msgPayload);

        // Fetch booking to find the both parties for global notification
        const booking = await Booking.findById(bookingId).populate('provider');
        if (booking && booking.provider && booking.provider.user) {
          const providerUserId = booking.provider.user.toString();
          const customerUserId = booking.user.toString();
          const receiverId = (String(senderId) === String(customerUserId)) ? providerUserId : customerUserId;
          
          // Notify receiver
          io.to(receiverId).emit('notification', {
            type: 'chat',
            title: `New Message from ${senderName}`,
            message: message,
          });

          // Notify sender (for visible testing and confirmation)
          io.to(senderId).emit('notification', {
            type: 'chat',
            title: `Message Sent`,
            message: `Delivered: ${message}`,
          });
        }
      } catch (err) {
        console.error('Failed to save message:', err);
      }
    });

    /**
     * Typing indicator event
     * Emit: { bookingId, userName, isTyping }
     */
    socket.on('typing', ({ bookingId, userName, isTyping }) => {
      socket.to(bookingId).emit('typing_indicator', { userName, isTyping });
    });

    /**
     * Leave a chat room
     * Emit: { bookingId, userId, userName }
     */
    socket.on('leave_room', ({ bookingId, userId, userName }) => {
      socket.leave(bookingId);
      socket.to(bookingId).emit('user_left', { userId, userName });
      console.log(`👋 ${userName} left room: ${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
