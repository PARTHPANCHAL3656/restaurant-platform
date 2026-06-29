import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isAuth = sessionStorage.getItem("staffAuthenticated") === "true";
  
  if (!isAuth) {
    return <Navigate to="/staff/login" replace />;
  }

  return children;
}
