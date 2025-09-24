// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null); // <-- add this
  const [location, setLocation] = useState({
    lat: localStorage.getItem('userLat'),
    lng: localStorage.getItem('userLng'),
  });

  // Auto-detect location on mount
  useEffect(() => {
    if (!location.lat || !location.lng) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude });
            localStorage.setItem('userLat', latitude);
            localStorage.setItem('userLng', longitude);
          },
          () => {}
        );
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[0]));
        setUser(decoded);
        setIsAuthenticated(true);
        setToken(token); // <-- add this
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
        setToken(null); // <-- add this
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null); // <-- add this
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    setUser(decoded);
    setIsAuthenticated(true);
    setToken(token); // <-- add this
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);
    setToken(null); // <-- add this
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      token, // <-- add this
      login,
      logout,
      location,
      setLocation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}