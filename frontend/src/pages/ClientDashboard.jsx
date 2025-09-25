// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';
import bgGeo from '../assets/geo5.jpg';

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
  const [showInbox, setShowInbox] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [replyThread, setReplyThread] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAvailableRentals = async () => {
      setLoading(true);
      try {
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
        setAvailableRentals([]);
      }
      setLoading(false);
    };
    fetchAvailableRentals();
  }, [propertyType, searchTown]);

  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates) && r.location.coordinates.length === 2
  );

  useEffect(() => {
    if (showInbox && user?.id) {
      api.get(`/chat/messages/recent/${user.id}`)
        .then(res => setInboxMessages(res.data))
        .catch(() => setInboxMessages([]));
    }
  }, [showInbox, user]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgGeo})`,
          filter: 'brightness(0.45) blur(1.5px)',
        }}
        aria-hidden="true"
      ></div>
      {/* Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none"></div>

      <main className="relative z-20 w-full max-w-7xl mx-auto px-4 py-8">
        {/* View Messages Button */}
        {user && (
          <div className="mb-4 flex justify-end">
            <button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl shadow-lg font-semibold hover:from-yellow-400 hover:to-pink-500 hover:scale-105 transition-all duration-300"
              onClick={() => {
                setShowInbox(true);
                setActiveTab('inbox');
                setReplyThread(null);
              }}
            >
              View Messages
            </button>
          </div>
        )}

        {/* Inbox/Reply Modal */}
        {showInbox && user && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-80 z-[1000] pointer-events-auto"
              onClick={() => setShowInbox(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-2 z-[1010] flex flex-col border-2 border-purple-700">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
                onClick={() => setShowInbox(false)}
              >
                &times;
              </button>
              <div className="flex border-b border-gray-200">
                <button
                  className={`flex-1 py-2 text-center font-semibold rounded-tl-3xl ${activeTab === 'inbox' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => {
                    setActiveTab('inbox');
                    setReplyThread(null);
                  }}
                >
                  Inbox
                </button>
                <button
                  className={`flex-1 py-2 text-center font-semibold rounded-tr-3xl ${activeTab === 'reply' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                  disabled={!replyThread}
                >
                  Reply
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                {activeTab === 'inbox' && (
                  <>
                    <h3 className="font-semibold mb-4 text-lg">Your Messages</h3>
                    {inboxMessages.length === 0 ? (
                      <p className="text-gray-500">No messages found.</p>
                    ) : (
                      <ul className="space-y-3">
                        {inboxMessages.map((msg, idx) => (
                          <li
                            key={idx}
                            className="border-b border-gray-200 pb-2 cursor-pointer hover:bg-blue-50 rounded transition"
                            onClick={() => {
                              setReplyThread({
                                rentalId: msg.rental_id,
                                receiverId: msg.sender_id === user.id ? msg.receiver_id : msg.sender_id,
                                rentalTitle: msg.rental_title || msg.title || msg.rental_id,
                              });
                              setActiveTab('reply');
                            }}
                          >
                            <div className="text-sm">
                              <span className="font-bold">{msg.sender_id === user.id ? 'You' : 'Landlord'}:</span>{' '}
                              {msg.message}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rental: <span className="font-semibold">{msg.rental_title || msg.title || msg.rental_id}</span> | {new Date(msg.created_at).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {activeTab === 'reply' && replyThread && (
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">
                      Chat for Rental: <span className="text-blue-700">{replyThread.rentalTitle}</span>
                    </h3>
                    <Chat
                      userId={user.id}
                      rentalId={replyThread.rentalId}
                      receiverId={replyThread.receiverId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-white drop-shadow-lg text-center tracking-tight">
          Client Dashboard
        </h2>

        <section className="mb-10">
          <h3 className="text-2xl font-bold mb-4 text-white text-center">Available Rentals & Lodgings</h3>
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-purple-700 shadow focus:ring-2 focus:ring-purple-400"
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
              className="bg-gray-800 text-white px-4 py-2 rounded border border-purple-700 shadow focus:ring-2 focus:ring-purple-400"
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
                          r.location.coordinates[0],
                          r.location.coordinates[1],
                        ],
                      },
                    }
                  : r
              )}
              height="h-64 md:h-96"
            />
          </div>

          {loading ? (
            <p className="text-gray-200 text-center">Loading...</p>
          ) : availableRentals.length === 0 ? (
            <p className="text-gray-300 text-center">No available rentals or lodgings found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableRentals.map(rental => (
                <div
                  key={rental.id}
                  className="bg-white/90 rounded-2xl shadow-xl p-5 flex flex-col mb-6 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 outline-none border-2 border-transparent hover:border-yellow-400"
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
                  <h4 className="font-bold text-lg mb-1 text-blue-900">{rental.title}</h4>
                  {rental.images && rental.images.length > 0 && (
                    <ImageCarousel
                      images={Array.isArray(rental.images) ? rental.images : JSON.parse(rental.images)}
                      alt={rental.title}
                    />
                  )}
                  <p className="text-gray-700 text-sm mb-2">{rental.description}</p>
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
                                rental.location.coordinates[0],
                                rental.location.coordinates[1],
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
                    className="bg-gradient-to-r from-blue-700 to-purple-700 text-white px-3 py-1 rounded mt-2 font-semibold hover:from-yellow-400 hover:to-pink-500 hover:scale-105 transition-all duration-300"
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
        <div className="mb-8 flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-4 text-white">For Inquiries : Chat with Admin 💬</h3>
          <a
            href="https://wa.me/254745420900"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl text-green-400 underline hover:text-green-300 transition"
          >
            WhatsApp
          </a>
        </div>
        {/* Chat Modal */}
        {showChat && chatRental && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-80 z-[1000] pointer-events-auto"
              onClick={() => setShowChat(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-2 z-[1010] flex flex-col border-2 border-purple-700">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
                onClick={() => setShowChat(false)}
              >
                &times;
              </button>
              <h3 className="font-semibold mb-2 text-lg text-blue-700 text-center">
                Chat with Landlord for: <span className="text-black">{chatRental.title}</span>
              </h3>
              <Chat
                userId={user?.id}
                rentalId={chatRental?.id}
                receiverId={chatRental?.landlord_id}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}