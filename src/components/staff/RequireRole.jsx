import React from 'react';
import { Navigate } from 'react-router-dom';

// Page-level guard for staff routes. The sidebar already hides links a role
// can't use, but typing the URL (or clicking a dashboard shortcut) still
// opened the page. The server is the real lock — this just stops showing
// people screens that can only fail.
export default function RequireRole({ roles, children }) {
  if (typeof window === 'undefined') return children;
  const role = sessionStorage.getItem('staffRole');
  if (!roles.includes(role)) {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return children;
}