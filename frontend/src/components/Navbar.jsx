// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-900 via-blue-900 to-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-extrabold text-purple-400 group-hover:scale-110 transition-transform duration-300">🏠</span>
          <span className="text-xl font-bold text-white tracking-wide group-hover:text-yellow-300 transition-colors duration-300">Home</span>
        </Link>

        <div className="flex gap-6 items-center">
          {/* Navigation Links */}
        
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-blue-400 transition">
              Admin
            </Link>
          )}
          {isAuthenticated && user?.role === 'landlord' && (
            <Link to="/landlord-dashboard" className="hover:text-blue-400 transition">
              Landlord Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'client' && (
            <Link to="/client-dashboard" className="hover:text-blue-400 transition">
              Client Dashboard
            </Link>
          )}
          {/* Authentication Buttons */}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded text-white ml-4">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow transition">Login</Link>
              <Link to="/register" className="px-4 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-semibold shadow transition">Sign Up</Link>
            </>
          )}
          
          {/* Profile Dropdown */}
          {isAuthenticated && (
            <div className="relative group">
              <button className="flex items-center gap-2 focus:outline-none">
                {/* Show full_name or name */}
                <span className="text-white font-semibold">
                  {user?.full_name || user?.name || 'Profile'}
                </span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                <Link to="/profile" className="block px-4 py-2 text-white hover:bg-purple-700">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}