import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';

const RentalCard = ({ rental, onDelete, onEdit, actionButton }) => {
  const navigate = useNavigate();

  // For each rental:
  const lat = rental.location.coordinates[1];
  const lng = rental.location.coordinates[0];

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col relative">
      <Link to={`/rentals/${rental.id}`}>
        {rental.images && rental.images.length > 0 && (
          <img
            src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
            alt={rental.title}
            className="w-full h-40 object-cover rounded mb-2"
          />
        )}
        <h4 className="font-bold text-lg mb-1">{rental.title}</h4>
        <p className="text-gray-400 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {rental.mode === 'lodging' ? (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.nightly_price}/night
            </span>
          ) : (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.price}/month
            </span>
          )}
          <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs">{rental.type}</span>
          <span className="bg-yellow-700 text-white px-2 py-1 rounded text-xs">
            {rental.status === 'booked' ? 'Booked' : (rental.status || 'available')}
          </span>
        </div>
      </Link>
      {rental.location && Array.isArray(rental.location.coordinates) && (
        <div className="mt-2">
          <MapComponent rentals={[{ ...rental, location: { ...rental.location, coordinates: [lat, lng] } }]} height="h-40" />
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {actionButton}
      </div>
    </div>
  );
}

export default RentalCard;