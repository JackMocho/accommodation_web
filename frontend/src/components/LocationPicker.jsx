import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const DEFAULT_POSITION = [-1.2833, 36.8167]; // Nairobi fallback

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });
  return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({ value, onChange, height = "h-64 md:h-80" }) {
  const [position, setPosition] = useState(
    value && value.coordinates ? [value.coordinates[0], value.coordinates[1]] : DEFAULT_POSITION
  );
  const isFirstRender = useRef(true);

  // Only update position from value if value actually changes
  useEffect(() => {
    if (
      value &&
      value.coordinates &&
      (value.coordinates[0] !== position[0] || value.coordinates[1] !== position[1])
    ) {
      setPosition([value.coordinates[0], value.coordinates[1]]);
    }
    // eslint-disable-next-line
  }, [value]);

  // Only call onChange when position changes due to user action, not when value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof onChange === 'function') {
      onChange({ type: 'Point', coordinates: [position[0], position[1]] });
    }
    // eslint-disable-next-line
  }, [position]);

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => alert('Unable to retrieve your location')
      );
    }
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2"
      >
        Pick My Location
      </button>
      <div className={`w-full rounded overflow-hidden ${height}`}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
      <div className="mt-2 text-sm text-gray-300">
        Selected Location: Latitude {position[0]}, Longitude {position[1]}
      </div>
    </div>
  );
}