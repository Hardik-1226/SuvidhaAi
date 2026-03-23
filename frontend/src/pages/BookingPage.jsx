/**
 * Booking Page
 * Date/time picker, service summary, and booking confirmation
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    scheduledAt: '',
    duration: 1,
    address: '',
    notes: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    api.get(`/services/${serviceId}`)
      .then((res) => {
        setService(res.data.data);
        const providerId = res.data.data.provider?._id || res.data.data.provider;
        // Fetch reviews for this provider
        if (providerId) {
          api.get(`/reviews/provider/${providerId}`)
            .then(revRes => setReviews(revRes.data.data || []))
            .catch(err => console.error('Failed to load reviews:', err));
        }
      })
      .catch(() => toast.error('Service not found'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', { serviceId, ...form });
      toast.success('Booking confirmed! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );

  if (!service) return <div className="text-center py-20 text-slate-600">Service not found.</div>;

  const provider = service.provider || {};
  const totalPrice = service.price * form.duration;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Book a Service</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
        {/* ---- Service Summary ---- */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Service Summary</h2>

          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-surface-border">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl flex-shrink-0">
              🔧
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold">{service.title}</h3>
              <p className="text-slate-600 text-sm capitalize">{service.category}</p>
              <p className="text-slate-600 text-sm mt-1">{service.description}</p>
            </div>
          </div>

          {/* Provider info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-border">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-semibold">
              {provider.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-slate-900 font-medium">{provider.user?.name}</p>
              <p className="text-slate-600 text-sm">{provider.user?.phone}</p>
            </div>
            <div className="ml-auto">
              <span className="text-yellow-400">⭐ {provider.ratings?.average || 'New'}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Rate</span>
              <span className="text-slate-900">₹{service.price}/{service.priceType === 'fixed' ? 'fixed' : 'hr'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Duration</span>
              <span className="text-slate-900">{form.duration} hour{form.duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-surface-border">
              <span className="text-slate-900">Total Estimated</span>
              <span className="text-primary-400">₹{service.priceType === 'fixed' ? service.price : totalPrice}</span>
            </div>
          </div>
        </div>

        {/* ---- Reviews Section ---- */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-slate-600 text-sm">No reviews yet for this provider.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-xl bg-surface border border-surface-border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-700/50 flex items-center justify-center text-xs font-bold text-white">
                        {rev.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-slate-900 text-sm font-semibold">{rev.user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-yellow-400 text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                      {rev.aiLabel === 'suspicious' ? (
                        <span className="badge badge-danger text-[10px] px-2 py-0.5">⚠️ Suspicious</span>
                      ) : rev.aiLabel === 'genuine' ? (
                        <span className="badge badge-success text-[10px] px-2 py-0.5">✔️ Verified</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm mt-2 font-medium">{rev.title}</p>
                  <p className="text-slate-600 text-sm mt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* ---- Booking Form ---- */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Booking Details</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Date & Time</label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                required min={new Date().toISOString().slice(0, 16)} className="input-field" />
            </div>

            {service.priceType === 'hourly' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (hours)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, duration: Math.max(1, form.duration - 1) })}
                    className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border text-slate-900 hover:border-primary-500 transition-all flex items-center justify-center text-xl">−</button>
                  <span className="text-slate-900 text-xl font-bold w-8 text-center">{form.duration}</span>
                  <button type="button" onClick={() => setForm({ ...form, duration: Math.min(8, form.duration + 1) })}
                    className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border text-slate-900 hover:border-primary-500 transition-all flex items-center justify-center text-xl">+</button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Address</label>
              <input type="text" placeholder="Your full address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions (optional)</label>
              <textarea rows={3} placeholder="Any specific notes for the provider..."
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <div className="flex gap-3">
                {['cash', 'online'].map((method) => (
                  <button key={method} type="button"
                    onClick={() => setForm({ ...form, paymentMethod: method })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all capitalize ${
                      form.paymentMethod === method
                        ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                        : 'border-surface-border text-slate-600 hover:border-slate-500'
                    }`}>
                    {method === 'cash' ? '💵 Cash' : '💳 Online'}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {submitting && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Confirming...' : `Confirm Booking — ₹${service.priceType === 'fixed' ? service.price : totalPrice}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
