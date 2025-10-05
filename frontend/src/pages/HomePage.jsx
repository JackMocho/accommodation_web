import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Import image for the hero background carousel
import geo5 from '../assets/geo5.jpg';
import img20 from '../assets/image20.jpg';
import img1 from '../assets/image1.jpg';

const heroImages = [
  geo5
];

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    rentals: 0,
    activeRentals: 0,
  });
  const [randomRentals, setRandomRentals] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [rentals, setRentals] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroInterval = useRef(null);
  const { isAuthenticated } = useAuth();

  // Auto-scroll hero background images
  useEffect(() => {
    heroInterval.current = setInterval(() => {
      setHeroIndex(idx => (idx + 1) % heroImages.length);
    }, 3500);
    return () => clearInterval(heroInterval.current);
  }, []);

  // Fetch stats on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/counts');
        setStats({
          users: res?.data?.users ?? 0,
          rentals: res?.data?.rentals ?? 0,
          activeRentals: res?.data?.activeRentals ?? 0,
        });
      } catch (err) {
        // error handling
      }
    };
    fetchStats();
  }, []);

  // Fetch rentals and filter by property type and status === 'available'
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await api.get('/rentals');
        const filteredRentals = res.data.filter(
          r => r.status === 'available'
        );
        setRentals(filteredRentals);
        setRandomRentals(filteredRentals.slice(0, 6));
      } catch (err) {
        // error handling
      }
    };
    fetchRentals();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Hero Background Carousel */}
      <div className="fixed inset-0 z-0">
        {heroImages.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              filter: 'brightness(0.45) blur(1.5px)',
              transition: 'opacity 1s',
            }}
            aria-hidden="true"
            draggable={false}
          />
        ))}
      </div>

      {/* Overlay for color tint */}
      <div className="fixed inset-0 z-10  pointer-events-none"></div>

      <main className="relative z-20">
        {/* Hero Section */}
        <section className="relative py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          {/* Section-specific background image */}
          <div
            className="absolute inset-0 w-full h-full z-0 rounded-3xl"
            style={{
              backgroundImage: `url(${img1})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.5) blur(1px)',
            }}
            aria-hidden="true"
          ></div>
          {/* Overlay for readability */}
          <div className="absolute inset-0  z-10 rounded-3xl"></div>
          <div className="max-w-4xl mx-auto text-center relative z-20">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 drop-shadow-2xl text-white tracking-tight leading-tight animate-fade-in-up">
              Find Your <span className="text-purple-400 bg-white/10 px-2 rounded-lg shadow-lg">Dream Accommodation</span> Now!
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-200 font-light drop-shadow-lg">
              Discover, advertise, and locate rentals and AirBnBs with a vibrant, efficient, secure community at your comfort.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                to="/register"
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl text-xl font-semibold transform transition hover:scale-105 hover:from-yellow-400 hover:to-pink-500 hover:shadow-3xl duration-300"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-blue-700 rounded-2xl shadow-2xl text-xl font-semibold transform transition hover:scale-105 hover:from-blue-400 hover:to-green-500 hover:shadow-3xl duration-300"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Listings Carousel */}
        <section className="py-16 px-4  rounded-t-3xl shadow-2xl mt-[-3rem]">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl font-bold mb-8 text-center text-purple-300 tracking-wide drop-shadow-lg">
              <span className="inline-block animate-bounce">🏡</span> Featured Listings
            </h3>
            <div className="flex justify-center mb-8">
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="bg-gray-800/80 text-white px-6 py-3 rounded-lg border border-purple-700 shadow-lg focus:ring-2 focus:ring-purple-400 transition"
              >
                <option value="all">All Types</option>
                <option value="rental">Rental (Monthly)</option>
                <option value="lodging">Lodging / AirBnB (Nightly)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {randomRentals.map((rental, idx) => (
                <div
                  key={idx}
                  className="bg-gray-600 rounded-2xl shadow-xl p-5 flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl duration-300 group border-2 border-transparent hover:border-yellow-400"
                >
                  {rental.images && rental.images.length > 0 && (
                    <img
                      src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
                      alt="Rental"
                      loading="lazy" // <-- Add this line
                      className="w-full h-48 object-cover rounded-xl mb-4 transition-transform duration-300 group-hover:scale-105 shadow-lg"
                    />
                  )}
                  <h4
                    className={`text-xl font-bold mb-1 text-white group-hover:text-purple-300 transition ${
                      !isAuthenticated ? 'blur-sm select-none pointer-events-none' : ''
                    }`}
                    title={!isAuthenticated ? 'Login to view title' : rental.title}
                  >
                    {!isAuthenticated ? 'Login to view title' : rental.title}
                  </h4>
                  <p className="text-gray-300 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
                  {rental.mode === 'lodging' ? (
                    <span className="bg-green-700 text-white px-4 py-1 rounded text-sm shadow">
                      KES {rental.nightly_price}/night
                    </span>
                  ) : (
                    <span className="bg-blue-700 text-white px-4 py-1 rounded text-sm shadow">
                      KES {rental.price}/month
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <Link
              to="/register"
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-2xl shadow-xl text-xl font-semibold transform transition hover:scale-110 hover:from-yellow-400 hover:to-pink-500 hover:shadow-3xl duration-300"
            >
              Register to Locate Now
            </Link>
          </div>
        </section>

        

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center tracking-wide text-purple-300 drop-shadow-lg">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
        {/* Stats Section */}
        <section
          className="py-8 px-2 rounded-b-xl shadow-lg relative overflow-hidden bg-gray-900/80"
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 z-0"></div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-center relative z-10">
            <StatCard label="Total Users" value={stats?.users ?? 0} />
            <StatCard label="Total Rentals" value={stats?.rentals ?? 0} />
            <StatCard
              label="Active Rentals"
              value={rentals.filter(r => r.status === 'available').length}
            />
          </div>
        </section>
        {/* Features */}
        <section className="py-20 px-4 ">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center text-purple-200 drop-shadow-lg">Why Choose Us?</h2>
            <ul className="space-y-7 text-xl">
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-pulse">🔐</span>
                <span>End-to-end encrypted chatting. Security first!</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-bounce">📡</span>
                <span>Real-time chat between clients and landlords</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-spin-slow">📷</span>
                <span>Property preview before contact – no surprises</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-pulse">🔒</span>
                <span> Access to variety of properties for perfect experience</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-bounce">🗺️</span>
                <span>Satellite map with GIS-powered filtering</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-3xl animate-bounce">💬</span>
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
      </main>
    </div>
  );
}

// Helper Components

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800/90 p-5 rounded-xl shadow border border-purple-500 transform transition hover:scale-105 hover:border-yellow-400 duration-300">
      <h3 className="text-2xl md:text-3xl font-bold text-yellow-300 mb-1">{value}</h3>
      <p className="mt-1 text-gray-200 text-base">{label}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }) {
  return (
    <div className="bg-gray-700/90 p-10 rounded-2xl shadow-xl text-center transform transition hover:scale-105 hover:bg-purple-700/90 duration-300">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-lg">
        {icon || number}
      </div>
      <h4 className="font-semibold text-2xl mb-3">{title}</h4>
      <p className="text-gray-200">{description}</p>
    </div>
  );
}