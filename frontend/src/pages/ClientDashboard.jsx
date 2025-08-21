// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import ChatInbox from '../components/ChatInbox';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';

function ImageCarousel({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch events for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) handlePrev(e);
    else if (deltaX < -50) handleNext(e);
    touchStartX.current = null;
  };

  if (!images.length) return null;

  return (
    <div
      className="relative w-full h-40 mb-2 overflow-hidden rounded"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={Array.isArray(images) ? images[index] : images}
        alt={alt}
        className="w-full h-40 object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white rounded-full px-2 py-1"
            onClick={handlePrev}
            aria-label="Previous image"
            tabIndex={0}
          >
            &#8592;
          </button>
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white rounded-full px-2 py-1"
            onClick={handleNext}
            aria-label="Next image"
            tabIndex={0}
          >
            &#8594;
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${i === index ? 'bg-white' : 'bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const [availableRentals, setAvailableRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('all');
  const [searchTown, setSearchTown] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatRental, setChatRental] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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
        if (searchTown.trim() !== '') {
          filtered = filtered.filter(r =>
            r.town && r.town.toLowerCase().includes(searchTown.trim().toLowerCase())
          );
        }
        setAvailableRentals(filtered);
      } catch (err) {
        console.error('Supabase insert error:', err);
        setAvailableRentals([]);
      }
      setLoading(false);
    };
    fetchAvailableRentals();
  }, [propertyType, searchTown]);

  // Rentals with valid location for map
  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates) && r.location.coordinates.length === 2
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen">
      {/* Chat Inbox for client */}
      {user && (
        <div className="mb-8">
          <ChatInbox userId={user.id} />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-white">
        Client Dashboard
      </h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Available Rentals & Lodgings</h3>
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
          <select
            value={propertyType}
            onChange={e => setPropertyType(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
          >
            <option value="all">All Types</option>
            <option value="rental">Rental (Monthly)</option>
            <option value="lodging">Lodging / AirBnB (Nightly)</option>
          </select>
          <input
            type="text"
            value={searchTown}
            onChange={e => setSearchTown(e.target.value)}
            placeholder="Search by town..."
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
          />
        </div>

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
                        r.location.coordinates[0], // lat
                        r.location.coordinates[1], // lng
                      ],
                    },
                  }
                : r
            )}
            height="h-64 md:h-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : availableRentals.length === 0 ? (
          <p className="text-gray-500">No available rentals or lodgings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRentals.map(rental => (
              <div
                key={rental.id}
                className="bg-white rounded shadow p-4 flex flex-col mb-6 cursor-pointer hover:shadow-lg transition outline-none"
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/rentals/${rental.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/rentals/${rental.id}`);
                  }
                }}
                title="Click to view full details"
              >
                {/* Rental Title */}
                <h4 className="font-bold text-lg mb-1 text-blue-900">{rental.title}</h4>
                {rental.images && rental.images.length > 0 && (
                  <ImageCarousel
                    images={Array.isArray(rental.images) ? rental.images : JSON.parse(rental.images)}
                    alt={rental.title}
                  />
                )}
                <p className="text-gray-600 text-sm mb-2">{rental.description}</p>
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
                    Owner: {rental.users?.full_name || rental.full_name || 'N/A'}
                  </span>
                  <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                    Contact: {rental.users?.phone || rental.phone || 'N/A'}
                  </span>
                </div>
                <div className="text-gray-700 text-sm mb-2">
                  <strong>Town:</strong> {rental.town || 'N/A'}
                  {rental.address && <> | <strong>Address:</strong> {rental.address}</>}
                </div>
                <div className="text-gray-700 text-sm mb-2">
                  <strong>Bedrooms:</strong> {rental.bedrooms || 'N/A'} | <strong>Bathrooms:</strong> {rental.bathrooms || 'N/A'}
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
                              rental.location.coordinates[0], // lat
                              rental.location.coordinates[1], // lng
                            ],
                          },
                        },
                      ]}
                      height="h-40"
                    />
                    <div className="text-sm text-gray-700 mt-1">
                      Location: Lat {rental.location.coordinates[0]}, Lng {rental.location.coordinates[1]}
                    </div>
                  </div>
                )}
                <button
                  className="bg-blue-700 text-white px-3 py-1 rounded mt-2"
                  onClick={e => {
                    e.stopPropagation();
                    setShowChat(true);
                    setChatRental(rental);
                  }}
                >
                  Chat with Landlord
                </button>
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
      {/* Chat Modal */}
      {showChat && chatRental && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setShowChat(false)}
            >
              &times;
            </button>
            <Chat
              rentalId={chatRental.id}
              userId={user?.id}
              receiverId={chatRental.landlord_id}
              userName={user?.full_name || user?.name}
              userPhone={user?.phone}
            />
          </div>
        </div>
      )}
    </div>
  );
}