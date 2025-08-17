// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Pages
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import SubmitRental from './pages/SubmitRental';
import RentalDetail from './pages/RentalDetail';
import LandlordDashboard from './pages/LandlordDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Profile from './pages/Profile';

// Protected route wrapper
import ProtectedRoute from './components/ProtectedRoute';

// Dotenvx – no need to import dotenvx in frontend

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="container mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />


            <Route
              path="/submit-rental"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <SubmitRental />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rentals/:id"
              element={
                <ProtectedRoute>
                  <RentalDetail />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Landlord and Client Routes */}
            <Route
              path="/landlord-dashboard"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-dashboard"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-center py-4 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} emissarygeospatials | All rights reserved
        </footer>
      </div>
    </Router>
  );
}