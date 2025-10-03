import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import api from '../utils/api';

const RentalCard = ({ rental, onDelete, onEdit, actionButton }) => {
  const navigate = useNavigate();
  const [landlordPhone, setLandlordPhone] = useState(null);

  // Fetch landlord phone using user_id
  useEffect(() => {
    async function fetchLandlordPhone() {
      if (!rental.user_id) return;
      try {
        const res = await api.get(`/users/${rental.user_id}`);
        if (res.data && res.data.phone) {
          setLandlordPhone(res.data.phone);
        }
      } catch (err) {
        setLandlordPhone(null);
      }
    }
    fetchLandlordPhone();
  }, [rental.user_id]);

  // WhatsApp link construction
  const whatsappLink = landlordPhone
    ? `https://wa.me/${landlordPhone.replace(/^0/, '254')}` // assumes Kenyan numbers
    : null;

  // For each rental:
  const lat = rental.location.coordinates[0];
  const lng = rental.location.coordinates[1];

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
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
            title="Chat with Landlord on WhatsApp"
          >
            Chat with Landlord
          </a>
        )}
      </div>
    </div>
  );
}

export default RentalCard;