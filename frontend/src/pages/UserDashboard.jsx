/**
 * User Dashboard Page
 * Shows booking history, reviews, and profile info
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const statusClass = {
  pending: 'badge-warning',
  accepted: 'badge-info',
  completed: 'badge-success',
  rejected: 'badge-danger',
  cancelled: 'badge-danger',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/me');
      setBookings(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${bookingId}`, { status: 'cancelled' });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const submitReview = async () => {
    try {
      await api.post('/reviews', {
        providerId: reviewModal.provider._id,
        bookingId: reviewModal._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Review submitted! ⭐');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const stats = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    spent: bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.totalPrice, 0),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl text-white font-bold shadow-glow">
          {user?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
          <p className="text-slate-600">{user?.email}</p>
        </div>
        <div className="ml-auto">
          <Link to="/services" className="btn-primary text-sm">Find Services</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: stats.total, icon: '📋' },
          { label: 'Completed', value: stats.completed, icon: '✅' },
          { label: 'Pending', value: stats.pending, icon: '⏳' },
          { label: 'Total Spent', value: `₹${stats.spent}`, icon: '💰' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-slate-600 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="card">
        <h2 className="text-lg font-bold text-slate-900 mb-6">My Bookings</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-slate-600">No bookings yet</p>
            <Link to="/services" className="btn-primary mt-4 inline-block text-sm">Browse Services</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface rounded-xl border border-surface-border hover:border-primary-500/30 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-slate-900 font-medium">{booking.service?.title}</p>
                    <span className={`badge ${statusClass[booking.status] || 'badge-info'}`}>{booking.status}</span>
                  </div>
                  <p className="text-slate-600 text-sm">Provider: {booking.provider?.user?.name}</p>
                  <p className="text-slate-700 text-xs mt-1">📅 {formatDate(booking.scheduledAt)} · 📍 {booking.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 font-bold">₹{booking.totalPrice}</p>
                  <div className="flex gap-2 mt-2 justify-end">
                    {booking.status === 'pending' && (
                      <button onClick={() => cancelBooking(booking._id)} className="text-xs bg-red-900/30 border border-red-600/50 text-red-400 px-3 py-1 rounded-lg hover:bg-red-900/50 transition-all">✗ Cancel</button>
                    )}
                    {booking.status === 'accepted' && (
                      <Link to={`/chat/${booking._id}`} className="text-xs btn-outline px-3 py-1">💬 Chat</Link>
                    )}
                    {booking.status === 'completed' && (
                      <button onClick={() => setReviewModal(booking)} className="text-xs btn-accent px-3 py-1">⭐ Review</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Leave a Review</h3>
            <p className="text-slate-600 text-sm mb-4">For: {reviewModal.service?.title}</p>
            <div className="mb-4">
              <label className="text-sm text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className={`text-3xl transition-transform hover:scale-110 ${n <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-600'}`}>★</button>
                ))}
              </div>
            </div>
            <textarea rows={4} placeholder="Share your experience..."
              value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input-field resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={submitReview} className="btn-primary flex-1">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
