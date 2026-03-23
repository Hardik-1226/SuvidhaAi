/**
 * SocketContext — Manages Socket.io connection
 * Socket is connected only when user is authenticated
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load user-specific notifications on login
  useEffect(() => {
    if (user && user._id) {
      try {
        const saved = localStorage.getItem(`ls_notifications_${user._id}`);
        setNotifications(saved ? JSON.parse(saved) : []);
      } catch {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Save changes to localStorage for this specific user
  useEffect(() => {
    if (user && user._id && notifications) {
      localStorage.setItem(`ls_notifications_${user._id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('authenticate', user._id);
        console.log('🔌 Socket connected:', newSocket.id);
      });

      newSocket.on('notification', ({ title, message, type }) => {
        toast.info(<div><strong>{title}</strong><br/>{message}</div>);
        setNotifications((prev) => [{ title, message, type, date: new Date() }, ...prev]);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
