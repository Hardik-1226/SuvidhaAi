/**
 * Login Page
 * JWT authentication form with role selection
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      // Role-based redirect
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'provider') navigate('/provider/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background orbs */}
      <div className="absolute top-40 left-1/3 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="card animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-2xl">SA</span>
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Welcome back</h1>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Demo credentials hint */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 text-sm text-gray-600">
            <p className="font-semibold text-primary-700 mb-2">🧪 Demo Credentials</p>
            <p>User: <code className="text-amber-600 font-bold">alice@example.com</code> / password123</p>
            <p>Provider: <code className="text-amber-600 font-bold">raj@provider.com</code> / password123</p>
            <p>Admin: <code className="text-amber-600 font-bold">admin@localservice.com</code> / admin123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" required className="input-field"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-800 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
