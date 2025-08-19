import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    rentals: 0,
  });
  const [randomRentals, setRandomRentals] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [rentals, setRentals] = useState([]);

  // Fetch stats on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/counts');
        setStats(res.data); // { rentals: 0, users: 2 }
      } catch (err) {}
    };
    fetchStats();
  }, []);

  // Fetch rentals and filter by property type and status === 'available' or 'booked'
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await api.get('/rentals');
        // Only show rentals with status 'available'
        const filteredRentals = res.data.filter(
          r => r.status === 'available'
        );
        setRentals(filteredRentals);
        setRandomRentals(filteredRentals.slice(0, 6));
      } catch (err) {
        // handle error
      }
    };
    fetchRentals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg transition-all duration-500 hover:scale-105">
            Find Your <span className="text-purple-400">Dream Accommodation</span> Now!
          </h1>
          <p className="text-lg md:text-2xl mb-10 text-gray-200 font-light">
            Discover, advertise, and locate rentals and AirBnBs with a vibrant, efficient, secure community at your comfort.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/register"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg text-lg font-semibold transform transition hover:scale-105 hover:from-yellow-400 hover:to-pink-500 hover:shadow-2xl duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-700 rounded-xl shadow-lg text-lg font-semibold transform transition hover:scale-105 hover:from-blue-400 hover:to-green-500 hover:shadow-2xl duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings Carousel */}
      <section className="py-12 px-4 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center text-purple-300 tracking-wide">
            <span className="inline-block animate-bounce">🏡</span> Featured Listings
          </h3>
          <div className="flex justify-center mb-8">
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-purple-700 shadow transition focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">All Types</option>
              <option value="rental">Rental (Monthly)</option>
              <option value="lodging">Lodging / AirBnB (Nightly)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {randomRentals.map((rental, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl duration-300 group"
              >
                {rental.images && rental.images.length > 0 && (
                  <img
                    src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
                    alt="Rental"
                    className="w-full h-44 object-cover rounded-lg mb-3 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <h4 className="text-lg font-bold mb-1 text-white group-hover:text-purple-300 transition blur">
                  {rental.title}
                </h4>
                <p className="text-gray-400 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
                {rental.mode === 'lodging' ? (
                  <span className="bg-green-700 text-white px-3 py-1 rounded text-sm shadow">
                    KES {rental.nightly_price}/night
                  </span>
                ) : (
                  <span className="bg-blue-700 text-white px-3 py-1 rounded text-sm shadow">
                    KES {rental.price}/month
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-10">
          <Link
            to="/register"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-xl shadow-lg text-lg font-semibold transform transition hover:scale-110 hover:from-yellow-400 hover:to-pink-500 hover:shadow-2xl duration-300"
          >
            Register to Locate Now
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-14 px-4 bg-gradient-to-t from-blue-800 via-blue-700 to-purple-400">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <StatCard label="Total Users" value={stats.users} />
          <StatCard label="Total Rentals" value={stats.rentals} />
          <StatCard label="Active Listings" value={stats.rentals} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center tracking-wide text-purple-300">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StepCard
              number="1"
              title="Register or Login"
              description="Create an account or log in with your credentials."
              icon="📝"
            />
            <StepCard
              number="2"
              title="List Your Property"
              description="Use our location picker or town input to list your rental."
              icon="🏠"
            />
            <StepCard
              number="3"
              title="Browse & Chat"
              description="Clients can contact landlords directly via Secure chat."
              icon="💬"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-800 via-blue-900 to-purple-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center text-purple-200">Why Choose Us?</h2>
          <ul className="space-y-5 text-lg">
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🔐</span>
              <span>End-to-end encrypted chatting. Security first!</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">📡</span>
              <span>Real-time chat between clients and landlords</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-spin-slow">📷</span>
              <span>Image preview before upload – no surprises</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🔒</span>
              <span>Admin dashboard for system management</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🗺️</span>
              <span>Satellite map with GIS-powered filtering</span>
            </li>
            {/* Add For Inquiries WhatsApp link */}
            <li className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">💬</span>
              <a
                href="https://wa.me/254745420900"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 underline hover:text-green-300 transition"
              >
                For Inquiries: Message us on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </section>

     
    </div>
  );
}

// Helper Components

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-700 p-8 rounded-xl shadow-lg border-2 border-purple-600 transform transition hover:scale-105 hover:border-yellow-400 duration-300">
      <h3 className="text-3xl md:text-4xl font-bold text-yellow-300 mb-2">{value}</h3>
      <p className="mt-2 text-gray-200 text-lg">{label}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }) {
  return (
    <div className="bg-gray-700 p-8 rounded-xl shadow-lg text-center transform transition hover:scale-105 hover:bg-purple-700 duration-300">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
        {icon || number}
      </div>
      <h4 className="font-semibold text-2xl mb-2">{title}</h4>
      <p className="text-gray-200">{description}</p>
    </div>
  );
}