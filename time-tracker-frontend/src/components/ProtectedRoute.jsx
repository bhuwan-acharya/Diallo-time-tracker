import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  console.log('ProtectedRoute rendered for role:', role); // Debugging log
  const userRole = getUserRole();
  console.log('User role:', userRole, 'Required role:', role); // Debugging log

  if (!isAuthenticated()) {
    console.log('User is not authenticated. Redirecting to login.');
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    console.log('User role does not match required role. Redirecting to dashboard.');
    return <RedirectToDashboard />;
  }

  console.log('User is authorized. Rendering child component.');
  return children;
};

export default ProtectedRoute;