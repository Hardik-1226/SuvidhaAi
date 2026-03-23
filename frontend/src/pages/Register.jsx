/**
 * Register Page
 * Allows signing up as a User or Service Provider
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const serviceCategories = ['plumber', 'electrician', 'carpenter', 'tutor', 'cleaner', 'painter', 'mechanic', 'other'];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    category: 'plumber', pricePerHour: '', description: '', experience: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = role === 'provider' ? '/auth/register-provider' : '/auth/register';
      const payload = role === 'provider'
        ? { ...form, role: 'provider', location: { type: 'Point', coordinates: [77.209, 28.6139] } }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone, role: 'user' };

      const res = await api.post(endpoint, payload);
      login(res.data.user, res.data.token);
      toast.success('Account created successfully! 🎉');
      role === 'provider' ? navigate('/provider/dashboard') : navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative">
        <div className="card animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-2xl">SA</span>
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Create your account</h1>
            <p className="text-gray-500 mt-1">Join the hyperlocal marketplace</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-surface rounded-xl p-1 mb-6">
            {['user', 'provider'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                  role === r ? 'bg-primary-600 text-white shadow-glow' : 'text-gray-500 hover:text-primary-700'
                }`}
              >
                {r === 'user' ? '👤 Customer' : '🔧 Service Provider'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required className="input-field" />
            </div>

            {/* Provider-specific fields */}
            {role === 'provider' && (
              <>
                <div className="border-t border-surface-border pt-4">
                  <p className="text-primary-700 text-sm font-semibold mb-4">Provider Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                      <select name="category" value={form.category} onChange={handleChange} className="input-field">
                        {serviceCategories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Price/Hour (₹)</label>
                      <input type="number" name="pricePerHour" value={form.pricePerHour} onChange={handleChange} placeholder="e.g. 300" required={role === 'provider'} className="input-field" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                  <input type="number" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 5" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe your service and expertise..." className="input-field resize-none" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
