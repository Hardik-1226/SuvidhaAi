/**
 * ServiceCard Component
 * Displays a service provider card with rating, price, availability
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StarRating = ({ rating }) => {
  const stars = Math.round(rating || 0);
  return (
    <span className="star-rating text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= stars ? 'text-yellow-400' : 'text-slate-600'}>★</span>
      ))}
    </span>
  );
};

const categoryIcons = {
  plumber: '🔧',
  electrician: '⚡',
  carpenter: '🪚',
  tutor: '📚',
  cleaner: '🧹',
  painter: '🎨',
  mechanic: '🔩',
  doctor: '🏥',
  other: '🛠️',
};

const ServiceCard = ({ service, onBook, isWeatherRecommended }) => {
  const navigate = useNavigate();
  const provider = service.provider || {};
  const user = provider.user || {};
  const icon = categoryIcons[service.category] || '🛠️';

  const handleCardClick = () => {
    if (onBook) onBook(service);
    else navigate(`/book/${service._id}`);
  };

  return (
    <div onClick={handleCardClick} className="card-hover group cursor-pointer animate-fade-in relative z-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-primary-900 font-semibold group-hover:text-primary-600 transition-colors">
              {service.title}
            </h3>
            {isWeatherRecommended && (
              <div className="mt-1.5 mb-0.5">
                <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold tracking-wider">
                  <span className="animate-pulse">🔥</span> High Demand
                </span>
              </div>
            )}
            <p className="text-gray-500 text-sm capitalize">{service.category}</p>
          </div>
        </div>
        <span className={`badge ${provider.isAvailable ? 'badge-success' : 'badge-danger'}`}>
          {provider.isAvailable ? 'Available' : 'Busy'}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{service.description}</p>

      {/* Provider info */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-border">
        <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-sm text-white font-semibold">
          {user.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-primary-800 text-sm font-medium">{user.name || 'Provider'}</p>
          <div className="flex items-center gap-1">
            <StarRating rating={provider.ratings?.average} />
            <span className="text-gray-500 text-xs">({provider.ratings?.count || 0})</span>
          </div>
        </div>
      </div>

      {/* Footer: price + book button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-primary-900">₹{service.price}</span>
          <span className="text-gray-500 text-sm">/{service.priceType === 'fixed' ? 'fixed' : 'hr'}</span>
        </div>
        {onBook ? (
          <button className="btn-primary text-sm px-4 py-2 pointer-events-none">
            Book Now
          </button>
        ) : (
          <span className="btn-primary text-sm px-4 py-2 pointer-events-none">
            Book Now
          </span>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
