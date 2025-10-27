// filepath: d:\Real property App\frontend\src\pages\LandlordDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MapComponent from '../components/MapComponent';
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
  const [sortPrice, setSortPrice] = useState('none');
  const [landlordPhones, setLandlordPhones] = useState({}); // rentalId: phone
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAvailableRentals = async () => {
      setLoading(true);
      try {
        const res = await api.get('/rentals');
        let filtered = res.data;
        filtered = filtered.filter(r => {
          const statusOk = r.status && String(r.status).toLowerCase() === 'available';
          const approved = r.approved;
          const approvedOk =
            approved === true ||
            String(approved).toLowerCase() === 'true' ||
            Number(approved) === 1;
          return statusOk && approvedOk;
        });
        if (propertyType !== 'all') {
          filtered = filtered.filter(r => r.mode === propertyType);
        }
        if (searchTown.trim() !== '') {
          filtered = filtered.filter(r =>
            r.town && r.town.toLowerCase().includes(searchTown.trim().toLowerCase())
          );
        }
        if (sortPrice === 'asc') {
          filtered = filtered.slice().sort((a, b) => {
            const priceA = a.mode === 'lodging' ? a.nightly_price : a.price;
            const priceB = b.mode === 'lodging' ? b.nightly_price : b.price;
            return (priceA ?? 0) - (priceB ?? 0);
          });
        }
        setAvailableRentals(filtered);
      } catch (err) {
        setAvailableRentals([]);
      }
      setLoading(false);
    };
    fetchAvailableRentals();
  }, [propertyType, searchTown, sortPrice]);

  // Fetch landlord phones for all rentals
  useEffect(() => {
    async function fetchPhones() {
      const phoneMap = {};
      for (const rental of availableRentals) {
        if (rental.user_id) {
          try {
            const res = await api.get(`/users/${rental.user_id}`);
            if (res.data && res.data.phone) {
              phoneMap[rental.id] = res.data.phone;
            }
          } catch {
            phoneMap[rental.id] = null;
          }
        }
      }
      setLandlordPhones(phoneMap);
    }
    if (availableRentals.length > 0) fetchPhones();
  }, [availableRentals]);

  const rentalsWithLocation = availableRentals.filter(
    r => r.location && Array.isArray(r.location.coordinates) && r.location.coordinates.length === 2
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgGeo})`,
          filter: 'brightness(0.45) blur(1.5px)',
        }}
        aria-hidden="true"
      ></div>
      <div className="fixed inset-0 z-10 pointer-events-none"></div>

      <main className="relative z-20 w-full max-w-7xl mx-auto px-4 py-8">
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
            <select
              value={sortPrice}
              onChange={e => setSortPrice(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-purple-700 shadow focus:ring-2 focus:ring-purple-400"
            >
              <option value="none">Sort: Default</option>
              <option value="asc">Price: Lowest to Highest</option>
            </select>
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
              {availableRentals.map(rental => {
                const landlordPhone = landlordPhones[rental.id];
                const whatsappLink = landlordPhone
                  ? `https://wa.me/${landlordPhone.replace(/^0/, '254')}`
                  : null;
                return (
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
                        Contact: {landlordPhone || rental.users?.phone || rental.phone || 'N/A'}
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
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-green-600 text-white p-4 rounded mt-2 font-semibold text-xs transition-all duration-300"
                        title="Chat with Landlord on WhatsApp"
                      >
                             WhatsApp Landlord
                      </a>
                    )}
                  </div>
                );
              })}
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
      </main>
    </div>
  );
}