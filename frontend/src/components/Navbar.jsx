// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bgGeo from '../assets/geo5.jpg';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <nav
      className="shadow-lg sticky top-0 z-50"
      style={{
        backgroundImage: `url(${bgGeo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Overlay for dark tint */}
      <div className="absolute inset-0 z-0 pointer-events-none"></div>
      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 py-3 flex items-center justify-between z-10">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl sm:text-2xl font-extrabold text-purple-400 group-hover:scale-110 transition-transform duration-300">🏠</span>
          <span className="text-lg sm:text-xl font-bold text-white tracking-wide group-hover:text-yellow-300 transition-colors duration-300">Home</span>
        </Link>

        {/* Hamburger for mobile */}
        <button
          className="sm:hidden flex items-center px-2 py-1 text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden sm:flex gap-6 items-center">
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-blue-400 transition">Admin</Link>
          )}
          {isAuthenticated && user?.role === 'landlord' && (
            <Link to="/landlord-dashboard" className="hover:text-blue-400 transition">Dashboard</Link>
          )}
          {isAuthenticated && user?.role === 'client' && (
            <Link to="/client-dashboard" className="hover:text-blue-400 transition">Dashboard</Link>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded text-white ml-4">Logout</button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow transition">Login</Link>
              <Link to="/register" className="px-4 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-semibold shadow transition">Sign Up</Link>
            </>
          )}
          {isAuthenticated && (
            <div className="relative group">
              <button className="flex items-center gap-2 focus:outline-none">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path stroke="currentColor" strokeWidth="2" d="M6 20c0-2.2 3.6-4 6-4s6 1.8 6 4" />
                </svg>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                <Link to="/profile" className="block px-4 py-2 text-white hover:bg-purple-700">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">Logout</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-gray-900 bg-opacity-95 shadow-lg rounded-b z-40 flex flex-col items-center py-4 animate-fade-in">
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin" className="block px-4 py-2 text-white hover:bg-blue-700 w-full text-center" onClick={() => setMenuOpen(false)}>Admin</Link>
            )}
            {isAuthenticated && user?.role === 'landlord' && (
              <Link to="/landlord-dashboard" className="block px-4 py-2 text-white hover:bg-blue-700 w-full text-center" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {isAuthenticated && user?.role === 'client' && (
              <Link to="/client-dashboard" className="block px-4 py-2 text-white hover:bg-blue-700 w-full text-center" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block px-4 py-2 text-white hover:bg-purple-700 w-full text-center" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block px-4 py-2 text-red-400 hover:bg-gray-700 w-full text-center">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-white hover:bg-blue-700 w-full text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block px-4 py-2 text-white hover:bg-purple-700 w-full text-center" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}