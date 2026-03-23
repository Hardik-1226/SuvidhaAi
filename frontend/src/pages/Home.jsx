/**
 * Home Page
 * Landing page with hero section, category quick links,
 * live map with nearby providers, and AI recommendation preview
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import api from '../services/api';

const categories = [
  { id: 'plumber', label: 'Plumber', icon: '🔧', color: 'from-blue-600 to-blue-800' },
  { id: 'electrician', label: 'Electrician', icon: '⚡', color: 'from-yellow-600 to-yellow-800' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚', color: 'from-purple-600 to-purple-800' },
  { id: 'tutor', label: 'Tutor', icon: '📚', color: 'from-green-600 to-green-800' },
  { id: 'cleaner', label: 'Cleaner', icon: '🧹', color: 'from-cyan-600 to-cyan-800' },
  { id: 'painter', label: 'Painter', icon: '🎨', color: 'from-orange-600 to-orange-800' },
];


export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Detect user location via Geolocation API
  const detectLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserLocation(loc);
          // Fetch nearby providers & weather
          try {
            const [provRes, weatherRes] = await Promise.all([
              api.get('/services'),
              api.get(`/weather?lat=${loc.lat}&lon=${loc.lon}`)
            ]);

            setWeather(weatherRes.data?.data);

            const providerData = (provRes.data.data || []).map((s) => ({
              ...s.provider,
              location: s.location || s.provider?.location,
              _id: s._id,
              title: s.title,
            }));
            setProviders(providerData);
          } catch { /* silent */ }
          setLoadingLocation(false);
        },
        () => {
          setLoadingLocation(false);
          // Default to Delhi if denied
          setUserLocation({ lat: 28.6139, lon: 77.209 });
        }
      );
    } else {
      setLoadingLocation(false);
    }
  };

  useEffect(() => { detectLocation(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services?q=${searchQuery}`);
  };

  return (
    <div className="min-h-screen">
      {/* ---- HERO SECTION ---- */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4" style={{ background: 'linear-gradient(135deg, #03233F 100%, #6DB5E7 0%)' }}>
        {/* Subtle glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 rounded-full mb-6 px-4 py-2 text-sm">
            <span className="animate-pulse-slow w-2 h-2 rounded-full bg-blue-300 inline-block" />
            AI-Powered Hyperlocal Marketplace
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in">
            Find Trusted{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
              Local Services
            </span>{' '}
            Near You
          </h1>

          <p className="text-blue-100/80 text-xl mb-10 max-w-2xl mx-auto animate-slide-up">
            Book verified plumbers, electricians, tutors &amp; more in minutes. AI-powered recommendations, real-time chat, and secure payments.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8 animate-slide-up">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services (e.g. plumber, tutor...)"
                className="w-full bg-white text-gray-800 placeholder-gray-400 border-0 rounded-xl px-4 py-3 pl-12 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">
              Search
            </button>
          </form>

          {/* Detect location button */}
          <button
            onClick={detectLocation}
            disabled={loadingLocation}
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm transition-colors"
          >
            {loadingLocation ? (
              <span className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {loadingLocation ? 'Detecting location...' : 'Use my current location'}
          </button>
        </div>
      </section>

