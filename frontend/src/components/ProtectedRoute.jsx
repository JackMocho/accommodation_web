// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && (!user.role || user.role !== requiredRole)) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" />;
    if (user.role === 'landlord') return <Navigate to="/landlord-dashboard" />;
    if (user.role === 'client') return <Navigate to="/client-dashboard" />;
    return <Navigate to="/login" />;
  }

  return children;
}