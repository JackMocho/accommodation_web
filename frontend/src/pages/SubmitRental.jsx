import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';
import useAutoLocation from '../hooks/useAutoLocation';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/image001.jpg';

export default function SubmitRental() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    nightly_price: '',
    type: '',
    images: [],
    town: '',
    location: null,
    coordinates: '',
    mode: 'rental',
  });

  const [previews, setPreviews] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useAutoLocation(setLat, setLng);

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      setForm((f) => ({
        ...f,
        location: { type: 'Point', coordinates: [lat, lng] },
      }));
    }
  }, [lat, lng]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = [];
    const newImages = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result);
        newImages.push(reader.result);
        if (newPreviews.length === files.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLocationChange = (loc) => {
    if (loc && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
      setForm((prev) => ({
        ...prev,
        coordinates: `${loc.coordinates[0]}, ${loc.coordinates[1]}`,
        location: loc
      }));
    }
  };

  const userId = localStorage.getItem('userId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    let latitude = null, longitude = null;
    if (form.coordinates) {
      const [latStr, lngStr] = form.coordinates.split(',').map(s => s.trim());
      latitude = latStr !== '' ? parseFloat(latStr) : null;
      longitude = lngStr !== '' ? parseFloat(lngStr) : null;
    }

    let location = form.location;
    if (!location && latitude !== null && longitude !== null) {
      location = { type: 'Point', coordinates: [longitude, latitude] };
    }

    const ownerId = user?.id || localStorage.getItem('userId');
    const price = form.price === '' ? null : Number(form.price);
    const nightly_price = form.nightly_price === '' ? null : Number(form.nightly_price);

    const payload = {
      ...form,
      price,
      nightly_price,
      coordinates: form.coordinates,
      latitude,
      longitude,
      location,
      landlord_id: ownerId,
      owner_id: ownerId,
      user_id: ownerId,
    };

    try {
      await api.post('/rentals', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('🎉 Congratulations! Your rental is saved!');
      setTimeout(() => {
        navigate('/HomePage', { state: { successMsg: 'Your property was listed successfully!' } });
      }, 1800);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveImage = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="w-full max-w-4xl bg-white bg-opacity-80 rounded-xl shadow-2xl p-8 backdrop-blur-md">
        <h2 className="text-4xl font-extrabold mb-4 text-gray-900 text-center drop-shadow-lg">List Your Property</h2>
        <p className="mb-6 text-gray-700 text-center text-lg">
          Fill in the details below to advertise your apartment. Your listing will be visible to all clients once approved.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-700 text-white rounded text-center font-semibold shadow text-xl">
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 transition-opacity duration-300 ${submitting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
              disabled={submitting}
            />

            <input
              name="type"
              value={form.type}
              onChange={handleChange}
              placeholder="Type (e.g. Apartment)"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
              required
              disabled={submitting}
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
            rows={3}
            disabled={submitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900"
              required
              disabled={submitting}
            >
              <option value="rental">Rental (Monthly)</option>
              <option value="lodging">Lodging / AirBnB (Nightly)</option>
            </select>

            {form.mode === 'rental' && (
              <input
                name="price"
                placeholder="Price per month"
                type="number"
                value={form.price}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
                required
                disabled={submitting}
              />
            )}

            {form.mode === 'lodging' && (
              <input
                name="nightly_price"
                placeholder="Nightly Price"
                type="number"
                value={form.nightly_price}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
                required
                disabled={submitting}
              />
            )}
          </div>

          <input
            name="town"
            value={form.town}
            onChange={handleChange}
            placeholder="Town Name"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900 placeholder-gray-400"
            required
            disabled={submitting}
          />

          <label className="block mb-2 font-semibold text-gray-700">
            Choose Images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 mt-2"
              disabled={submitting}
            />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt="Property"
                    className="rounded-lg shadow-lg border-2 border-green-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-800 transition-all z-10"
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <LocationPicker value={form.location} onChange={handleLocationChange} disabled={submitting} />

          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 rounded-lg shadow-lg text-xl transition-all duration-200"
            disabled={submitting}
          >
            Submit Rental
          </button>
        </form>

        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white rounded-xl p-8 shadow-2xl text-2xl font-bold text-green-700 text-center">
              {successMsg
                ? '🎉 Congratulations! Your rental is saved!'
                : 'Submitting the rental, wait!'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}