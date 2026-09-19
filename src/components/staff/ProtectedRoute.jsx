import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStaff();

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  return children;
}
