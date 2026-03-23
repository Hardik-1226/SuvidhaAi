/**
 * Chat Page
 * Real-time chat between user and provider via Socket.io
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function ChatPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [booking, setBooking] = useState(null);
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  let typingTimer = useRef(null);

  // Fetch booking details & chat history
  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((res) => setBooking(res.data.data)).catch(() => {});
    api.get(`/messages/${bookingId}`).then((res) => setMessages(res.data.data)).catch(() => {});
  }, [bookingId]);

  // Join socket room & listen for messages
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('join_room', { bookingId, userId: user._id, userName: user.name });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('typing_indicator', ({ userName, isTyping }) => {
      setTyping(isTyping ? `${userName} is typing...` : '');
    });

    socket.on('user_joined', ({ userName }) => {
      setMessages((prev) => [...prev, {
        senderId: 'system', senderName: 'System',
        message: `${userName} joined the chat`, timestamp: new Date().toISOString(), isSystem: true,
      }]);
    });

    return () => {
      socket.emit('leave_room', { bookingId, userId: user._id, userName: user.name });
      socket.off('receive_message');
      socket.off('typing_indicator');
      socket.off('user_joined');
    };
  }, [socket, user, bookingId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_message', {
      bookingId, senderId: user._id, senderName: user.name, message: input.trim(),
    });
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket?.emit('typing', { bookingId, userName: user.name, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('typing', { bookingId, userName: user.name, isTyping: false });
    }, 1500);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 h-screen flex flex-col">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
          💬
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Booking Chat</h1>
          <p className="text-slate-400 text-sm">
            {booking ? `Service: ${booking.service?.title}` : 'Loading...'}
          </p>
        </div>
        <div className="ml-auto">
          <span className="badge badge-success">● Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 card overflow-y-auto mb-4 space-y-3 p-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <div className="text-4xl mb-3">💬</div>
            <p>Say hello to start the conversation!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.isSystem) return (
            <div key={idx} className="text-center text-slate-500 text-xs py-1">{msg.message}</div>
          );

          const isMe = msg.senderId === user?._id;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <span className="text-slate-500 text-xs mb-1 ml-1">{msg.senderName}</span>}
              <div className={isMe ? 'chat-bubble-user' : 'chat-bubble-other'}>
                <p className="text-sm">{msg.message}</p>
              </div>
              <span className="text-slate-600 text-xs mt-1 mx-1">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}

        {typing && <div className="text-slate-500 text-xs italic">{typing}</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text" value={input} onChange={handleTyping}
          placeholder="Type a message..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary px-5 py-3" disabled={!input.trim()}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
