import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Loader size="lg" text="Chargement..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      medecin: '/doctor/dashboard',
      infirmier: '/nurse/dashboard',
      receptionniste: '/receptionist/dashboard',
      patient: '/patient/dashboard'
    };
    
    return <Navigate to={dashboardRoutes[user?.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;