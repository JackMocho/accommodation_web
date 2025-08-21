// src/components/MapComponent.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { BaseLayer } = LayersControl;
const DEFAULT_CENTER = [-1.2833, 36.8167]; // Nairobi fallback

export default function MapComponent({ rentals = [], userLocation, rentalLocation, height = "h-64 md:h-96" }) {
  const [zoom, setZoom] = useState(15);

  // Find first valid rental location for centering, else fallback
  let center = DEFAULT_CENTER;
  let firstRentalWithLocation = rentals.find(
    r => r.location && Array.isArray(r.location.coordinates) && r.location.coordinates.length === 2
  );
  if (firstRentalWithLocation) {
    center = [
      firstRentalWithLocation.location.coordinates[0], // lat
      firstRentalWithLocation.location.coordinates[1], // lng
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
          // Use [lat, lng] everywhere in frontend
          const lat = r.location?.coordinates?.[0];
          const lng = r.location?.coordinates?.[1];
          return (typeof lat === 'number' && typeof lng === 'number') ? (
            <Marker position={[lat, lng]} key={`rental-${index}`}>
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