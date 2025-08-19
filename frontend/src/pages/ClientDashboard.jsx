// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';

export default function ClientDashboard() {
  const [availableRentals, setAvailableRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('all');

  useEffect(() => {
    const fetchAvailableRentals = async () => {
      setLoading(true);
      try {
        // Fetch rentals with status=available and correct mode (handled by backend)
        const res = await api.get('/rentals');
        let filtered = res.data;
        if (propertyType !== 'all') {
          filtered = filtered.filter(r => r.mode === propertyType);
        }
        setAvailableRentals(filtered);
      } catch (err) {
        setAvailableRentals([]);
      }
      setLoading(false);
    };
    fetchAvailableRentals();
  }, [propertyType]);

  // Rentals with valid location for map
  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-white">
        Client Dashboard
      </h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Available Rentals & Lodgings</h3>
        <div className="flex justify-center mb-6">
          <select
            value={propertyType}
            onChange={e => setPropertyType(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
          >
            <option value="all">All Types</option>
            <option value="rental">Rental (Monthly)</option>
            <option value="lodging">Lodging / AirBnB (Nightly)</option>
          </select>
        </div>

        {rentalsWithLocation.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-2 text-center text-white">All Rental & Lodging Locations</h4>
            <MapComponent
              rentals={rentalsWithLocation.map(r =>
                r.location && Array.isArray(r.location.coordinates)
                  ? {
                      ...r,
                      location: {
                        ...r.location,
                        coordinates: [
                          r.location.coordinates[1], // lat
                          r.location.coordinates[0], // lng
                        ],
                      },
                    }
                  : r
              )}
              height="h-64 md:h-96"
            />
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : availableRentals.length === 0 ? (
          <p className="text-gray-500">No available rentals or lodgings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRentals.map(rental => (
              <div key={rental.id} className="bg-white rounded shadow p-4 flex flex-col mb-6">
                {rental.images && rental.images.length > 0 && (
                  <img
                    src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
                    alt={rental.title}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                )}
                <h4 className="font-bold text-lg mb-1">{rental.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {rental.mode === 'lodging' || rental.mode === 'airbnb' ? (
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
                  <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                    Owner: {rental.landlord_name || 'N/A'}
                  </span>
                </div>
                {rental.location && Array.isArray(rental.location.coordinates) && (
                  <div className="mt-2">
                    <MapComponent
                      rentals={[
                        {
                          ...rental,
                          location: {
                            ...rental.location,
                            coordinates: [
                              rental.location.coordinates[1], // lat
                              rental.location.coordinates[0], // lng
                            ],
                          },
                        },
                      ]}
                      height="h-40"
                    />
                    <div className="text-sm text-gray-700 mt-1">
                      Location: Lat {rental.location.coordinates[1]}, Lng {rental.location.coordinates[0]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="mb-8 items-center">
        <h3 className="text-xl font-semibold mb-4">For Inquiries : Chat with Admin💬 </h3>
        <button>
          <a
            href="https://wa.me/254745420900"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl text-green-400 underline hover:text-green-300 transition"
          >
            WhatsApp
          </a>
        </button>
      </div>
    </div>
  );
}