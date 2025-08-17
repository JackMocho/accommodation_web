// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import NotificationBell from '../components/NotificationBell';
import MapComponent from '../components/MapComponent';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RentalCard from '../components/RentalCard'; // <-- Use shared RentalCard

export default function ClientDashboard() {
  const [availableRentals, setAvailableRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('all');
  const [showAdminChat, setShowAdminChat] = useState(false);
  const token = localStorage.getItem('token');
  const { notifications, clearNotifications } = useSocket();
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || localStorage.getItem('userName') || '';

  useEffect(() => {
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }

    const fetchAvailableRentals = async () => {
      try {
        const res = await api.get('/rentals');
        let filtered = res.data.filter(r => r.status === 'available');
        if (propertyType !== 'all') {
          filtered = filtered.filter(r => r.mode === propertyType);
        }
        setAvailableRentals(filtered);
      } catch (err) {
        setAvailableRentals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRentals();
  }, [token, propertyType]);

  // Show all rentals (both rental and lodging) with valid location on the map
  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates)
  );

  // Only show available rentals
  const visibleRentals = availableRentals.filter(r => r.status === 'available');

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userName} (Client)</h2>
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
              rentals={rentalsWithLocation}
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
            {visibleRentals.map(rental => (
              <RentalCard key={rental.id} rental={rental} />
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