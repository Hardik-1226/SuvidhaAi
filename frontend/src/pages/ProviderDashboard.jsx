/**
 * Provider Dashboard Page
 * Manage bookings, toggle availability, view earnings
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';

const statusClass = { pending: 'badge-warning', accepted: 'badge-info', completed: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-danger' };
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [tab, setTab] = useState('bookings'); // 'bookings' | 'earnings' | 'services'
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ title: '', category: 'plumber', description: '', price: '', priceType: 'hourly' });
  const [submittingService, setSubmittingService] = useState(false);

  const [addressSearch, setAddressSearch] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const handleLocationSearch = async () => {
    if (!addressSearch.trim()) return;
    setSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setNewService(prev => ({ ...prev, location: { type: 'Point', coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)] } }));
        toast.success(`Location set: ${data[0].display_name.split(',')[0]}!`);
      } else {
        toast.error('Location not found.');
      }
    } catch {
      toast.error('Failed to search location.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const fetchData = async () => {
    try {
      const [bookRes, profileRes] = await Promise.all([
        api.get('/bookings/provider'),
        api.get('/providers/me'),
      ]);
      setBookings(bookRes.data.data || []);
      setProfile(profileRes.data.data);
      if (profileRes.data.data?._id) {
        const servRes = await api.get(`/services?providerId=${profileRes.data.data._id}`);
        setServices(servRes.data.data || []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh when notifications (like reviews) occur
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchData();
    socket.on('notification', handleRefresh);
    return () => socket.off('notification', handleRefresh);
  }, [socket]);

  const toggleAvailability = async () => {
    try {
      const res = await api.patch('/providers/availability');
      setProfile((p) => ({ ...p, isAvailable: res.data.isAvailable }));
      toast.success(res.data.message);
    } catch (err) { toast.error('Failed to toggle availability'); }
  };

  const updateStatus = async (bookingId, status) => {
    setUpdating(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}`, { status });
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status } : b));
      toast.success(`Booking ${status}!`);
    } catch (err) { toast.error('Failed to update booking'); }
    finally { setUpdating(null); }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setSubmittingService(true);
    try {
      const res = await api.post('/services', { ...newService, price: Number(newService.price) });
      setServices([res.data.data, ...services]);
      setShowAddModal(false);
      setNewService({ title: '', category: 'plumber', description: '', price: '', priceType: 'hourly' });
      toast.success('Service added successfully!');
      setTab('services');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add service');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      setServices(services.filter(s => s._id !== serviceId));
      toast.success('Service deleted successfully');
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported');
    toast.info('Fetching your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewService(prev => ({ ...prev, location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] } }));
        toast.success('Location captured successfully!');
      },
      () => toast.error('Failed to get location. Ensure permissions are granted.')
    );
  };

  const earnings = {
    total: profile?.totalEarnings || 0,
    jobs: profile?.completedJobs || 0,
    pending: bookings.filter((b) => b.status === 'pending').length,
    rating: profile?.ratings?.average || 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl text-white font-bold shadow-glow">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-slate-600 capitalize">{profile?.category} provider</p>
            {profile?.isVerified && <span className="badge badge-success text-xs">✓ Verified</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Online/Offline toggle */}
          <button onClick={toggleAvailability}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
              profile?.isAvailable
                ? 'bg-green-900/30 border-green-600/50 text-green-400 hover:bg-green-900/50'
                : 'bg-red-900/30 border-red-600/50 text-red-400 hover:bg-red-900/50'
            }`}>
            <span className={`w-2 h-2 rounded-full ${profile?.isAvailable ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {profile?.isAvailable ? 'Online' : 'Offline'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-outline text-sm">+ Add Service</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: `₹${earnings.total}`, icon: '💰' },
          { label: 'Jobs Completed', value: earnings.jobs, icon: '✅' },
          { label: 'Pending Bookings', value: earnings.pending, icon: '⏳' },
          { label: 'Average Rating', value: `${earnings.rating || 'New'} ⭐`, icon: '⭐' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-slate-600 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 w-fit">
        {['bookings', 'earnings', 'services'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'bookings' ? '📋 Bookings' : t === 'earnings' ? '📊 Earnings' : '🛠️ Services'}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Incoming Bookings</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12"><div className="text-5xl mb-3">📋</div><p className="text-slate-600">No bookings yet</p></div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-4 bg-surface rounded-xl border border-surface-border hover:border-primary-500/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-900 font-medium">{booking.service?.title}</p>
                        <span className={`badge ${statusClass[booking.status]}`}>{booking.status}</span>
                      </div>
                      <p className="text-slate-600 text-sm">Customer: {booking.user?.name} · {booking.user?.phone}</p>
                      <p className="text-slate-500 text-xs mt-1">📅 {formatDate(booking.scheduledAt)}</p>
                      <p className="text-slate-500 text-xs">📍 {booking.address}</p>
                      {booking.notes && <p className="text-slate-600 text-xs mt-1 italic">"{booking.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-bold text-lg">₹{booking.totalPrice}</p>
                      {/* Action buttons by status */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => updateStatus(booking._id, 'accepted')} disabled={updating === booking._id}
                            className="btn-primary text-xs px-3 py-1.5">✓ Accept</button>
                          <button onClick={() => updateStatus(booking._id, 'rejected')} disabled={updating === booking._id}
                            className="bg-red-900/30 border border-red-600/50 text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition-all">✗ Reject</button>
                        </div>
                      )}
                      {booking.status === 'accepted' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => updateStatus(booking._id, 'completed')} disabled={updating === booking._id}
                            className="btn-primary text-xs px-3 py-1.5">✅ Complete</button>
                          <Link to={`/chat/${booking._id}`} className="btn-outline text-xs px-3 py-1.5">💬 Chat</Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'earnings' && (
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Earnings Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl p-6 border border-surface-border">
              <p className="text-slate-600 text-sm mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-green-400">₹{earnings.total}</p>
              <p className="text-slate-500 text-sm mt-2">from {earnings.jobs} completed {earnings.jobs === 1 ? 'job' : 'jobs'}</p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-surface-border">
              <p className="text-slate-600 text-sm mb-2">Average per Job</p>
              <p className="text-4xl font-bold text-primary-400">
                ₹{earnings.jobs > 0 ? Math.round(earnings.total / earnings.jobs) : 0}
              </p>
              <p className="text-slate-500 text-sm mt-2">per completed booking</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {bookings.filter((b) => b.status === 'completed').map((b) => (
              <div key={b._id} className="flex justify-between items-center py-3 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-slate-900 text-sm">{b.service?.title}</p>
                  <p className="text-slate-500 text-xs">{formatDate(b.completedAt || b.scheduledAt)}</p>
                </div>
                <span className="text-green-400 font-semibold">+₹{b.totalPrice}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-6">My Services</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />)}</div>
          ) : services.length === 0 ? (
            <div className="text-center py-12"><div className="text-5xl mb-3">🛠️</div><p className="text-slate-600">You haven't added any services yet.</p></div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service._id} className="p-4 bg-surface rounded-xl border border-surface-border flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-900 font-semibold flex items-center gap-2">
                       {service.title}
                       <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
                         {service.isActive ? 'Active' : 'Inactive'}
                       </span>
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">{service.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-primary-400 font-bold block mb-1">₹{service.price}/{service.priceType === 'fixed' ? 'fixed' : 'hr'}</span>
                    <button onClick={() => handleDeleteService(service._id)} className="text-xs bg-red-900/30 border border-red-600/50 text-red-400 px-3 py-1 rounded-lg hover:bg-red-900/50 transition-all">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add New Service</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-600 hover:text-slate-900 text-xl">✕</button>
            </div>
            
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Title</label>
                <input type="text" required value={newService.title} onChange={(e) => setNewService({...newService, title: e.target.value})} className="input-field" placeholder="e.g. Emergency Plumbing Repair" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={newService.category} onChange={(e) => setNewService({...newService, category: e.target.value})} className="input-field capitalize">
                    {['plumber', 'electrician', 'carpenter', 'tutor', 'cleaner', 'painter', 'mechanic', 'doctor', 'other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹)</label>
                  <input type="number" required min="0" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} className="input-field" placeholder="e.g. 500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Type</label>
                <div className="flex gap-3">
                  {['hourly', 'fixed'].map(type => (
                    <button key={type} type="button" onClick={() => setNewService({...newService, priceType: type})} 
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all capitalize ${newService.priceType === type ? 'bg-primary-600/20 border-primary-500 text-primary-400' : 'border-surface-border text-slate-600 hover:border-slate-500'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea required rows="3" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} className="input-field resize-none" placeholder="Describe the service details..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Location</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <button type="button" onClick={handleGetLocation} className="btn-outline text-sm px-4 py-2 flex items-center gap-2">
                      📍 {newService.location ? 'Location Captured ✓' : 'Auto-detect My Location'}
                    </button>
                    <p className="text-xs text-slate-500">
                      {newService.location ? 'Location set!' : 'Uses your profile location by default'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 p-1 bg-surface border border-surface-border rounded-xl">
                    <input 
                      type="text" 
                      placeholder="Or search city / address..." 
                      value={addressSearch} 
                      onChange={(e) => setAddressSearch(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(); } }}
                      className="input-field text-sm flex-1 border-none focus:ring-0 bg-transparent" 
                    />
                    <button type="button" onClick={handleLocationSearch} disabled={searchingLocation} className="btn-primary px-4 py-2 text-xs mr-1">
                      {searchingLocation ? '...' : '🔍 Search'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition-all">Cancel</button>
                <button type="submit" disabled={submittingService} className="btn-primary text-sm px-6 py-2 flex items-center gap-2">
                  {submittingService && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submittingService ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
