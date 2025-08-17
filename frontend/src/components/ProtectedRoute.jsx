// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to the correct dashboard based on user.role
    if (user.role === 'admin') return <Navigate to="/AdminDashboard" />;
    if (user.role === 'landlord') return <Navigate to="/LandlordDashboard" />;
    if (user.role === 'client') return <Navigate to="/ClientDashboard" />;
   
  }

  return children;
}