// src/components/MapComponent.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { BaseLayer } = LayersControl;
const DEFAULT_CENTER = [-1.2833, 36.8167]; // Nairobi fallback

// Fix Leaflet's default icon paths to use CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapComponent({ rentals, userLocation, rentalLocation, height = "h-64 md:h-96" }) {
  const [zoom, setZoom] = useState(15);

  if (!rentals || rentals.length === 0) return null;

  // Center map between both points if available
  let center = DEFAULT_CENTER;
  if (userLocation && rentalLocation) {
    center = [
      (userLocation[0] + rentalLocation[0]) / 2,
      (userLocation[1] + rentalLocation[1]) / 2,
    ];
  } else if (userLocation) {
    center = userLocation;
  } else if (rentalLocation) {
    center = rentalLocation;
  }

  const points = [];
  if (userLocation) points.push(userLocation);
  if (rentalLocation) points.push(rentalLocation);

  return (
    <div className={`w-full rounded overflow-hidden ${height}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
        whenCreated={map => map.on('zoomend', () => setZoom(map.getZoom()))}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />
          </BaseLayer>
        </LayersControl>

        {/* Rental markers */}
        {rentals.map((r, index) => {
          const lat = r.location?.coordinates?.[1];
          const lng = r.location?.coordinates?.[0];
          return lat && lng ? (
            <Marker position={[r.location.coordinates[1], r.location.coordinates[0]]} key={`rental-${index}`}>
              <Popup>
                <strong>{r.title}</strong>
                <br />
                {r.description?.slice(0, 60)}...
              </Popup>
            </Marker>
          ) : null;
        })}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {rentalLocation && (
          <Marker position={rentalLocation}>
            <Popup>Rental Location</Popup>
          </Marker>
        )}
        {points.length === 2 && (
          <Polyline positions={points} color="blue" />
        )}
      </MapContainer>
      <div className="text-xs text-gray-400 mt-1">
        Zoom: {zoom}
      </div>
    </div>
  );
}