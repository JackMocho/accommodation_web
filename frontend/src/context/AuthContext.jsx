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
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload); // If your backend returns user info in payload
        setIsAuthenticated(true);
        setToken(token);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    // REMOVE setApiToken(token);
    // No need to call setApiToken, axios interceptor handles token
  }, [token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
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