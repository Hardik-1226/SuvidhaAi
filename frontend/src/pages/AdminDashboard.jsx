/**
 * Admin Dashboard Page
 * Platform management: stats, users, providers, reviews
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, providersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/providers'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
      setProviders(providersRes.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u));
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch { toast.error('Failed to update user'); }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.patch(`/admin/providers/${providerId}/verify`);
      setProviders((prev) => prev.map((p) => p._id === providerId ? { ...p, isVerified: true } : p));
      toast.success('Provider verified ✅');
    } catch { toast.error('Failed to verify provider'); }
  };

  const TABS = ['overview', 'users', 'providers'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-red-900/50 border border-red-700/50 flex items-center justify-center text-2xl">🛡️</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Platform Management & Monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '🔧 Providers'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats && [
              { label: 'Users', value: stats.totalUsers, icon: '👥', color: 'text-blue-400' },
              { label: 'Providers', value: stats.totalProviders, icon: '🔧', color: 'text-purple-400' },
              { label: 'Services', value: stats.totalServices, icon: '🛠️', color: 'text-green-400' },
              { label: 'Bookings', value: stats.totalBookings, icon: '📋', color: 'text-yellow-400' },
              { label: 'Reviews', value: stats.totalReviews, icon: '⭐', color: 'text-orange-400' },
              { label: 'Revenue', value: `₹${stats.totalRevenue}`, icon: '💰', color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent users overview */}
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Recent Platform Activity</h2>
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u._id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs text-white font-semibold">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'provider' ? 'badge-info' : 'badge-success'}`}>{u.role}</span>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Banned'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">All Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="pb-3 text-slate-400 font-medium">Name</th>
                  <th className="pb-3 text-slate-400 font-medium">Email</th>
                  <th className="pb-3 text-slate-400 font-medium">Role</th>
                  <th className="pb-3 text-slate-400 font-medium">Status</th>
                  <th className="pb-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 text-white font-medium">{u.name}</td>
                    <td className="py-3 text-slate-400">{u.email}</td>
                    <td className="py-3"><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'provider' ? 'badge-info' : 'badge-success'}`}>{u.role}</span></td>
                    <td className="py-3"><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleUserStatus(u._id, u.isActive)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            u.isActive
                              ? 'border-red-600/50 text-red-400 hover:bg-red-900/30'
                              : 'border-green-600/50 text-green-400 hover:bg-green-900/30'
                          }`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {tab === 'providers' && (
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">All Providers ({providers.length})</h2>
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface rounded-xl border border-surface-border hover:border-primary-500/30 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{p.user?.name}</p>
                    {p.isVerified ? <span className="badge badge-success text-xs">✓ Verified</span> : <span className="badge badge-warning text-xs">Unverified</span>}
                    <span className="badge badge-info text-xs capitalize">{p.category}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{p.user?.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>⭐ {p.ratings?.average || 'New'} ({p.ratings?.count || 0} reviews)</span>
                    <span>💰 ₹{p.totalEarnings} earned</span>
                    <span>✅ {p.completedJobs} jobs</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!p.isVerified && (
                    <button onClick={() => verifyProvider(p._id)}
                      className="text-xs btn-primary px-3 py-1.5">Verify</button>
                  )}
                  <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                    {p.isAvailable ? '● Online' : '● Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
