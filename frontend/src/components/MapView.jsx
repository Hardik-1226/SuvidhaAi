/**
 * MapView Component
 * Displays interactive OpenStreetMap with Leaflet.js
 * Shows provider/service pins with popups
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icons for different categories
const categoryColors = {
  plumber: '#3b82f6',
  electrician: '#f59e0b',
  carpenter: '#8b5cf6',
  tutor: '#10b981',
  cleaner: '#06b6d4',
  painter: '#f97316',
  mechanic: '#ef4444',
  default: '#6b7280',
};

const createCustomIcon = (category) => {
  const color = categoryColors[category] || categoryColors.default;
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    className: '',
  });
};

const userIcon = L.divIcon({
  html: `<div style="
    background: #22c55e;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(34,197,94,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

// Component to dynamically update map view when center changes
const MapUpdater = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center && map) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapView = ({ center = [28.6139, 77.209], providers = [], userLocation = null, onProviderClick }) => {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      zoomControl={true}
    >
      <MapUpdater center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-semibold">📍 Your Location</div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={2000}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.05, weight: 1 }}
          />
        </>
      )}

      {/* Provider/service markers */}
      {providers.map((provider, idx) => {
        const [lon, lat] = provider.location?.coordinates || [77.209, 28.6139];
        const icon = createCustomIcon(provider.category);

        return (
          <Marker
            key={provider._id || idx}
            position={[lat, lon]}
            icon={icon}
            eventHandlers={{ click: () => onProviderClick && onProviderClick(provider) }}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#f1f5f9' }}>
                  {provider.title || provider.user?.name || 'Provider'}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {provider.category}
                </p>
                <p style={{ fontSize: '13px', color: '#fbbf24', marginTop: '4px' }}>
                  ⭐ {provider.ratings?.average || 'New'}
                </p>
                <p style={{ fontSize: '13px', color: '#60a5fa' }}>
                  ₹{provider.pricePerHour}/hr
                </p>
                <div style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  background: provider.isAvailable ? '#14532d' : '#450a0a',
                  color: provider.isAvailable ? '#4ade80' : '#f87171',
                  fontSize: '11px',
                  display: 'inline-block'
                }}>
                  {provider.isAvailable ? '● Online' : '● Offline'}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
