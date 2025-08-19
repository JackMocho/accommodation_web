// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import NotificationBell from '../components/NotificationBell';
import MapComponent from '../components/MapComponent';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RentalCard from '../components/RentalCard';

export default function ClientDashboard() {
  const [availableRentals, setAvailableRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('all');
  const token = localStorage.getItem('token');
  const { notifications, clearNotifications } = useSocket();
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || localStorage.getItem('userName') || '';
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }

    // Only fetch rentals if user is a client
    if (user && user.role === 'client') {
      if (user.approved) {
        const fetchAvailableRentals = async () => {
          setLoading(true);
          try {
            // Fetch all rentals with status=available from the backend
            const res = await api.get('/rentals');
            let filtered = res.data;
            if (propertyType !== 'all') {
              filtered = filtered.filter(r => r.mode === propertyType);
            }
            setAvailableRentals(filtered);
            setActiveCount(filtered.length);
          } catch (err) {
            setAvailableRentals([]);
            setActiveCount(0);
          }
          setLoading(false);
        };
        fetchAvailableRentals();
      } else {
        setAvailableRentals([]);
        setActiveCount(0);
        setLoading(false);
      }
    } else {
      setAvailableRentals([]);
      setActiveCount(0);
      setLoading(false);
    }
  }, [token, propertyType, user]);

  // Show all rentals (both rental and lodging) with valid location on the map
  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates)
  );

  // Only show available rentals
  const visibleRentals = availableRentals;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userName} (Client)</h2>
        <div className="bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow ml-4">
          Active Rentals: {activeCount}
        </div>
      </div>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Available Rentals & Lodgings</h3>
        {/* Property Type Filter */}
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

        {/* Map showing both Rentals and Lodgings/AirBnB */}
        {rentalsWithLocation.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-2 text-center">All Rental & Lodging Locations</h4>
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
        ) : user && user.role === 'client' && !user.approved ? (
          <p className="text-yellow-400">Your account is pending approval. Please wait for admin approval to view available rentals.</p>
        ) : availableRentals.length === 0 ? (
          <p className="text-gray-500">No available rentals or lodgings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRentals.map(rental => (
              <div key={rental.id} className="mb-6">
                <RentalCard rental={rental} />
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
                      height="h-48"
                    />
                    <div className="text-sm text-gray-200 mt-1">
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