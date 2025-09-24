import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';
import useAutoLocation from '../hooks/useAutoLocation';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext'; // <-- add this import

export default function SubmitRental() {
  const navigate = useNavigate();
  const { token } = useAuth(); // <-- get token from context
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    nightly_price: '',
    type: '',
    images: [],
    town: '',
    location: null,
    coordinates: '', // <-- add this
    mode: 'rental',
  });

  const [previews, setPreviews] = useState([]);
  const [successMsg, setSuccessMsg] = useState(''); // CHANGED
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useAutoLocation(setLat, setLng);

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      setForm((f) => ({
        ...f,
        // FIX: Send [lat, lng] instead of [lng, lat]
        location: { type: 'Point', coordinates: [lat, lng] },
      }));
    }
  }, [lat, lng]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file uploads for images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = [];
    const newImages = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result);
        newImages.push(reader.result);
        // Only update state after all files are read
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

  // When picking location, store as string "lat, lng"
  const handleLocationChange = (loc) => {
    if (loc && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
      setForm((prev) => ({
        ...prev,
        coordinates: `${loc.coordinates[0]}, ${loc.coordinates[1]}`,
        location: loc // keep for compatibility if needed
      }));
    }
  };

  const userId = localStorage.getItem('userId'); // Make sure this is set!

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    // Parse coordinates string
    let latitude = null, longitude = null;
    if (form.coordinates) {
      const [latStr, lngStr] = form.coordinates.split(',').map(s => s.trim());
      latitude = parseFloat(latStr);
      longitude = parseFloat(lngStr);
    }

    // Always send location as GeoJSON [lng, lat] for backend/PostGIS
    let location = form.location;
    if (!location && latitude !== null && longitude !== null) {
      location = { type: 'Point', coordinates: [longitude, latitude] }; // GeoJSON standard
    }

    const payload = {
      ...form,
      coordinates: form.coordinates, // send as string
      latitude,
      longitude,
      location, // send as GeoJSON
      landlord_id: userId,
    };

    try {
      await api.post('/rentals', payload, {
        headers: { Authorization: `Bearer ${token}` } // <-- send token here
      });
      setSuccessMsg('Rental submitted successfully!');
      setTimeout(() => {
        navigate('/HomePage', { state: { successMsg: 'Your property was listed successfully!' } });
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">List Your Property</h2>
      <p className="mb-6 text-gray-300">
        Fill in the details below to advertise your apartment. Your listing will be visible to all clients once approved.
      </p>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-700 text-white rounded">
          {successMsg}
        </div>
      )}

      {submitting && (
        <div className="mb-4 p-3 bg-blue-700 text-white rounded">
          Submitting the rental, wait!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 bg-gray-900 text-white rounded"
        />

        <select
          name="mode"
          value={form.mode}
          onChange={handleChange}
          className="w-full p-2 mb-2 rounded"
          required
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
            className="w-full p-2 mb-2 rounded"
            required
          />
        )}

        {form.mode === 'lodging' && (
          <input
            name="nightly_price"
            placeholder="Nightly Price"
            type="number"
            value={form.nightly_price}
            onChange={handleChange}
            className="w-full p-2 mb-2 rounded"
            required
          />
        )}

        <input
          name="type"
          value={form.type}
          onChange={handleChange}
          placeholder="Type (e.g. Apartment)"
          className="w-full p-2 mb-2 rounded"
          required
        />

        <input
          name="town"
          value={form.town}
          onChange={handleChange}
          placeholder="Town Name"
          className="w-full p-2 mb-2 rounded"
          required
        />

        <input type="file" multiple accept="image/*" onChange={handleImageChange} />

        {previews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {previews.map((preview, index) => (
              <img src={preview} alt="Property" key={index} className="rounded shadow" />
            ))}
          </div>
        )}

        <LocationPicker value={form.location} onChange={handleLocationChange} />

        <button
          type="submit"
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Submit Rental
        </button>
      </form>
    </div>
  );
}