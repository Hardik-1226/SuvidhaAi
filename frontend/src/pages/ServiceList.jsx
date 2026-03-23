/**
 * Service List Page
 * Browse and filter all services with AI recommendations
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';
import MapView from '../components/MapView';

const CATEGORIES = ['all', 'plumber', 'electrician', 'carpenter', 'tutor', 'cleaner', 'painter', 'mechanic'];

export default function ServiceList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('ls_user_location');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [weatherRecs, setWeatherRecs] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    maxDistance: 20000,
    minPrice: '',
    maxPrice: '',
    sortBy: 'rating',
  });

  const [addressSearch, setAddressSearch] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!addressSearch.trim()) return;
    setSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      } else {
        alert('Location not found. Try a different city or address.');
      }
    } catch {
      alert('Failed to search location.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(userLocation && { lat: userLocation.lat, lon: userLocation.lon, maxDistance: filters.maxDistance }),
      };
      const res = await api.get('/services', { params });
      setServices(res.data.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!userLocation) return;
    try {
      const res = await api.get('/providers/recommend', {
        params: {
          lat: userLocation.lat, lon: userLocation.lon,
          ...(filters.category !== 'all' && { category: filters.category }),
        },
      });
      setRecommendations(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!userLocation) {
      // Default to Delhi if no location is saved
      setUserLocation({ lat: 28.6139, lon: 77.209 });
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('ls_user_location', JSON.stringify(userLocation));
      // Fetch weather recommendations specifically for badges
      api.get(`/weather?lat=${userLocation.lat}&lon=${userLocation.lon}`)
        .then(res => setWeatherRecs(res.data.data?.recommendedServices || []))
        .catch(() => {});
    }
  }, [userLocation]);

  useEffect(() => { fetchServices(); }, [filters, userLocation]);
  useEffect(() => { fetchRecommendations(); }, [userLocation, filters.category]);

  const providers = services.map((s) => ({
    ...s.provider, location: s.location, _id: s.provider?._id, category: s.category,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Find Services</h1>
          <p className="text-gray-500">{loading ? 'Searching...' : `${services.length} services found`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:text-primary-700 border border-surface-border'}`}>
            ☰ Grid
          </button>
          <button onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:text-primary-700 border border-surface-border'}`}>
            🗂 Map
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ---- Filter Sidebar ---- */}
        <aside className="w-64 flex-shrink-0 hidden lg:block space-y-6">
          <div className="card">
            <h3 className="text-primary-900 font-semibold mb-4">Category</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button key={cat}
                  onClick={() => setFilters((f) => ({ ...f, category: cat }))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                    filters.category === cat ? 'bg-primary-600/10 text-primary-700 border border-primary-600/30' : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50'
                  }`}>
                  {cat === 'all' ? '🌐 All Services' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-primary-900 font-semibold mb-4">Price Range (₹/hr)</h3>
            <div className="space-y-3">
              <input type="number" placeholder="Min price" value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                className="input-field text-sm" />
              <input type="number" placeholder="Max price" value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                className="input-field text-sm" />
            </div>
          </div>

          <div className="card">
            <h3 className="text-primary-900 font-semibold mb-4">Sort By</h3>
            <select value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))} className="input-field text-sm">
              <option value="rating">Best Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div className="card">
            <h3 className="text-primary-900 font-semibold mb-4">Location & Range</h3>
            
            <form onSubmit={handleLocationSearch} className="flex gap-2 mb-3">
              <input type="text" placeholder="City or Address" value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} className="input-field text-sm flex-1" />
              <button type="submit" disabled={searchingLocation} className="btn-primary px-3 text-sm">{searchingLocation ? '...' : '🔍'}</button>
            </form>
            
            <button onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                  () => alert('Please enable location access in your browser.')
                );
              }
            }} className="w-full btn-outline text-xs py-2 mb-4">📍 Use My Network Location</button>

            <div className="pt-4 border-t border-surface-border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-primary-900 font-semibold text-sm">Distance Radius</h3>
                <span className="text-primary-600 text-xs font-bold">{Math.round(filters.maxDistance / 1000)} km</span>
              </div>
              <input type="range" min="1000" max="50000" step="1000" value={filters.maxDistance}
                onChange={(e) => setFilters((f) => ({ ...f, maxDistance: parseInt(e.target.value) }))}
                className="w-full accent-primary-500" />
            </div>
          </div>
        </aside>

        {/* ---- Main Content ---- */}
        <div className="flex-1">
          {/* AI Recommendations Strip */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h2 className="text-primary-900 font-bold text-lg">AI-Recommended for You</h2>
                <span className="badge badge-info">Top Picks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((prov) => (
                  <div key={prov._id} className="card border-primary-500/30 hover:border-primary-400/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/services?category=${prov.category}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-primary-900 font-semibold">{prov.user?.name || 'Provider'}</span>
                      <span className="badge badge-success text-xs">AI Pick #{recommendations.indexOf(prov) + 1}</span>
                    </div>
                    <p className="text-gray-500 text-sm capitalize">{prov.category}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-amber-500 text-sm">⭐ {prov.ratings?.average || 'New'}</span>
                      <span className="text-primary-700 font-semibold">₹{prov.pricePerHour}/hr</span>
                    </div>
                    {prov.aiScore && <p className="text-xs text-gray-500 mt-2">AI Score: {(prov.aiScore * 100).toFixed(0)}%</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View: Grid or Map */}
          {viewMode === 'grid' ? (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-4 bg-surface rounded w-3/4 mb-4" />
                      <div className="h-3 bg-surface rounded w-1/2 mb-2" />
                      <div className="h-3 bg-surface rounded w-full mb-6" />
                      <div className="h-8 bg-surface rounded" />
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-primary-900 mb-2">No services found</h3>
                  <p className="text-gray-500">Try adjusting your filters or location</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <ServiceCard key={service._id} service={service} isWeatherRecommended={weatherRecs.includes(service.category)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[600px] rounded-2xl overflow-hidden border border-surface-border">
              <MapView
                center={userLocation ? [userLocation.lat, userLocation.lon] : [28.6139, 77.209]}
                providers={providers}
                userLocation={userLocation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
