/**
 * Home Page
 * Landing page with hero section, category quick links,
 * live map with nearby providers, and AI recommendation preview
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MapView from '../components/MapView';
import api from '../services/api';

const categories = [
  { id: 'plumber', label: 'Plumber', icon: '🔧', color: 'from-blue-600 to-blue-800' },
  { id: 'electrician', label: 'Electrician', icon: '⚡', color: 'from-yellow-600 to-yellow-800' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚', color: 'from-purple-600 to-purple-800' },
  { id: 'tutor', label: 'Tutor', icon: '📚', color: 'from-green-600 to-green-800' },
  { id: 'cleaner', label: 'Cleaner', icon: '🧹', color: 'from-cyan-600 to-cyan-800' },
  { id: 'painter', label: 'Painter', icon: '🎨', color: 'from-orange-600 to-orange-800' },
  { id: 'ac repair', label: 'AC Repair', icon: '❄️', color: 'from-cyan-400 to-cyan-600' },
  { id: 'roof repair', label: 'Roof Repair', icon: '🏠', color: 'from-amber-700 to-amber-900' },
  { id: 'mechanic', label: 'Mechanic', icon: '🏎️', color: 'from-red-600 to-red-800' },
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
          toast.success("Location updated!");
          // Fetch nearby providers & weather
          try {
            const [provRes, weatherRes] = await Promise.all([
              api.get(`/services?lat=${loc.lat}&lon=${loc.lon}&maxDistance=50000`),
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
          } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to fetch nearby data");
          }
          setLoadingLocation(false);
        },
        (err) => {
          setLoadingLocation(false);
          console.error("Geolocation error:", err);
          let msg = "Could not get location. Using default.";
          if (err.code === 1) msg = "Location permission denied.";
          else if (err.code === 2) msg = "Location unavailable.";
          else if (err.code === 3) msg = "Location request timed out.";
          
          toast.warning(msg);
          // Default to Delhi if denied
          setUserLocation({ lat: 28.6139, lon: 77.209 });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLoadingLocation(false);
      toast.error("Geolocation is not supported by this browser.");
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

      {/* ---- WEATHER SUGGESTED ---- */}
      {weather && weather.recommendedServices && weather.recommendedServices.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-20 animate-fade-in mt-20">
          <div className="flex items-center justify-center gap-4 mb-8 bg-surface-card p-4 rounded-2xl border border-primary-500/20 w-fit mx-auto shadow-glow">
            <div className="text-4xl">
              {weather.condition.includes('Rain') || weather.condition.includes('Thunder') ? '🌧️' : weather.temperature > 30 ? '🔥' : '☁️'}
            </div>
            <div className="text-left">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Current Weather</p>
              <p className="text-primary-900 font-bold text-lg leading-tight">{weather.temperature}°C, {weather.condition}</p>
            </div>
          </div>

          <h2 className="section-title text-center">Recommended For You Today</h2>
          <p className="section-subtitle text-center mb-8">Services experiencing high demand based on local weather conditions</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {weather.recommendedServices.map(catId => {
              const cat = categories.find(c => c.id === catId);
              if (!cat) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/services?category=${cat.id}`)}
                  className="group flex flex-col items-start gap-4 p-5 rounded-2xl bg-white border border-primary-500/20
                             hover:bg-primary-50 hover:border-primary-400 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center w-full gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-primary-900 font-bold text-lg block">{cat.label}</span>
                      <span className="inline-flex items-center gap-1 mt-1 bg-primary-50 text-primary-600 text-[10px] px-2 py-0.5 rounded border border-primary-200 uppercase font-bold tracking-wider">
                        <span className="animate-pulse">●</span> High Demand
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- CATEGORIES ---- */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <h2 className="section-title text-center">Browse by Category</h2>
        <p className="section-subtitle text-center mb-8">Find the right expert for your need</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/services?category=${cat.id}`)}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border
                         hover:border-primary-500/50 hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:shadow-glow transition-all`}>
                {cat.icon}
              </div>
              <span className="text-gray-600 text-sm font-medium group-hover:text-primary-800 transition-colors">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- LIVE MAP ---- */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Providers Near You</h2>
            <p className="section-subtitle">
              {providers.length > 0 ? `${providers.length} providers found in your area` : 'Enable location to see nearby providers'}
            </p>
          </div>
          <button onClick={() => navigate('/services')} className="btn-outline text-sm">
            View All →
          </button>
        </div>
        <div className="h-96 rounded-2xl overflow-hidden border border-surface-border shadow-card">
          <MapView
            center={userLocation ? [userLocation.lat, userLocation.lon] : [28.6139, 77.209]}
            providers={providers}
            userLocation={userLocation}
          />
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="section-title text-center">How It Works</h2>
        <p className="section-subtitle text-center mb-12">Get a service booked in 3 simple steps</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Search & Discover', desc: 'Find verified providers nearby using AI-powered recommendations and smart filters.', icon: '🔍' },
            { step: '02', title: 'Book Instantly', desc: 'Select your preferred time slot, add special instructions, and confirm your booking.', icon: '📅' },
            { step: '03', title: 'Get it Done', desc: 'Chat with your provider in real time, track progress, and pay securely after job completion.', icon: '✅' },
          ].map((item) => (
            <div key={item.step} className="card text-center group hover:border-primary-500/50 transition-all">
              <div className="text-5xl mb-4">{item.icon}</div>
              <div className="text-primary-600 text-sm font-semibold mb-2">Step {item.step}</div>
              <h3 className="text-primary-900 text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 text-6xl">⚡</div>
            <div className="absolute bottom-4 right-8 text-6xl">🔧</div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 relative">Ready to get started?</h2>
          <p className="text-blue-200 text-lg mb-8 relative">Join thousands of happy customers finding quality local services.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <button onClick={() => navigate('/register')} className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95">
              Get Started Free
            </button>
            <button onClick={() => navigate('/services')} className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-all">
              Browse Services
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 text-center text-slate-500 text-sm">
        © 2026 SuvidhaAI · Made By Hardik.
      </footer>
    </div>
  );
}
