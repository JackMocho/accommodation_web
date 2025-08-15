import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function EditRentalForm({ rental, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: rental.title || '',
    description: rental.description || '',
    price: rental.price || '',
    type: rental.type || '',
    images: Array.isArray(rental.images) ? rental.images : [],
    town: rental.town || '',
    location: rental.location && Array.isArray(rental.location.coordinates)
      ? {
          type: 'Point',
          coordinates: [
            Number(rental.location.coordinates[0]),
            Number(rental.location.coordinates[1])
          ]
        }
      : { type: 'Point', coordinates: [null, null] },
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-sense location on mount if not set
  useEffect(() => {
    if (
      (!form.location?.coordinates?.[0] && !form.location?.coordinates?.[1]) ||
      form.location.coordinates[0] === null ||
      form.location.coordinates[1] === null
    ) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            setForm(f => ({
              ...f,
              location: {
                type: 'Point',
                coordinates: [
                  Number(pos.coords.longitude),
                  Number(pos.coords.latitude)
                ]
              }
            }));
          }
        );
      }
    }
  }, []);

  const handleLocationChange = (lat, lng) => {
    setForm({
      ...form,
      location: {
        type: 'Point',
        coordinates: [
          lng !== '' && !isNaN(Number(lng)) ? Number(lng) : null,
          lat !== '' && !isNaN(Number(lat)) ? Number(lat) : null
        ]
      }
    });
  };

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          handleLocationChange(pos.coords.latitude, pos.coords.longitude);
        },
        () => alert('Could not get your location')
      );
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/rentals/${rental.id}`, form);
      setSuccessMsg('Saved successfully!');
      if (onSave) onSave();
      setTimeout(() => setSuccessMsg(''), 1200);
    } catch (err) {
      alert('Failed to save rental');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-gray-700 p-4 rounded mb-4">
      {successMsg && (
        <div className="mb-2 p-2 bg-green-700 text-white rounded">{successMsg}</div>
      )}
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        className="w-full p-2 rounded"
        placeholder="Title"
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        className="w-full p-2 rounded"
        placeholder="Description"
        required
      />
      <input
        name="price"
        type="number"
        value={form.price}
        onChange={handleChange}
        className="w-full p-2 rounded"
        placeholder="Price"
        required
      />
      <input
        name="town"
        value={form.town}
        onChange={handleChange}
        className="w-full p-2 rounded"
        placeholder="Town"
        required
      />
      <input
        name="type"
        value={form.type}
        onChange={handleChange}
        className="w-full p-2 rounded"
        placeholder="Type"
        required
      />
      {/* Location fields */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={form.location?.coordinates?.[1] ?? ''}
          onChange={e => handleLocationChange(e.target.value, form.location?.coordinates?.[0] ?? '')}
          className="p-2 rounded bg-gray-700 text-white flex-1"
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={form.location?.coordinates?.[0] ?? ''}
          onChange={e => handleLocationChange(form.location?.coordinates?.[1] ?? '', e.target.value)}
          className="p-2 rounded bg-gray-700 text-white flex-1"
          required
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="bg-blue-600 px-3 py-2 rounded text-white"
        >
          Use My Location
        </button>
      </div>
      {/* Show current images only, no upload */}
      <div className="mb-2">
        <label className="block text-sm mb-1">Current Images</label>
        <div className="flex gap-2">
          {Array.isArray(form.images) && form.images.map((img, idx) =>
            img ? (
              <img
                key={idx}
                src={img}
                alt={`Image ${idx + 1}`}
                className="w-24 h-24 object-cover rounded"
              />
            ) : null
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white">Save</button>
        <button type="button" onClick={onCancel} className="bg-gray-500 px-4 py-2 rounded text-white">Cancel</button>
      </div>
    </form>
  );
}