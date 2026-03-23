/**
 * Navbar Component
 * Responsive navigation with auth state, role-based links, and mobile menu
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, setNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleToggleNotifications = () => {
    if (!showNotifications && notifications?.some(n => !n.isRead)) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
    setShowNotifications(!showNotifications);
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'provider') return '/provider/dashboard';
    return '/dashboard';
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Find Services' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-card/90 backdrop-blur-lg border-b border-surface-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow group-hover:shadow-glow transition-all">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="text-primary-900 font-bold text-lg hidden sm:block">
              Suvidha<span className="text-primary-600">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(l.to)
                    ? 'bg-primary-600/10 text-primary-700'
                    : 'text-gray-600 hover:text-primary-800 hover:bg-primary-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side: auth actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button onClick={handleToggleNotifications} className="text-gray-600 hover:text-primary-800 p-2 relative outline-none hover:bg-primary-50 rounded-full transition-all">
                    🔔
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">{unreadCount}</span>}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-surface-card border border-surface-border rounded-xl shadow-xl overflow-hidden z-50 animate-slide-up">
                      <div className="p-3 border-b border-surface-border flex justify-between items-center bg-surface">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        {notifications?.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-white transition-all bg-surface-card border border-surface-border px-2 py-1 rounded">Clear All</button>}
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-hide">
                        {notifications?.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                        ) : (
                          notifications?.map((notif, i) => (
                            <div key={i} className={`p-4 border-b border-surface-border hover:bg-white/5 transition-all ${!notif.isRead ? 'bg-primary-900/10' : ''}`}>
                              <p className="text-white text-sm font-semibold">{notif.title}</p>
                              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{notif.message}</p>
                              <p className="text-slate-500 text-[10px] mt-2">{new Date(notif.date).toLocaleTimeString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard link */}
                <Link
                  to={getDashboardLink()}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-primary-800 hover:bg-primary-50 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                </Link>

                {/* Role badge */}
                <span className={`hidden sm:inline badge ${
                  user?.role === 'admin' ? 'badge-danger' :
                  user?.role === 'provider' ? 'badge-info' : 'badge-success'
                }`}>
                  {user?.role}
                </span>

                <button onClick={handleLogout} className="btn-outline text-sm px-3 py-1.5">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden text-slate-300 hover:text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-border pb-4 pt-2 space-y-1 animate-slide-up">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-sm text-primary-400 hover:bg-white/5 rounded-lg"
              >
                My Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
