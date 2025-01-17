// src/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthMethod } from '../../types/auth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, step } = useAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const location = useLocation();

  // Get the current auth method
  const authMethod = localStorage.getItem('auth_method') as AuthMethod;

  // Handle loading states
  const isLoading = !isClerkLoaded || step === 'CONNECTING_WALLET' || step === 'CHECKING_NETWORK';
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check auth based on method
  const isAuthorized = authMethod === AuthMethod.WEB3 ? isAuthenticated : isSignedIn;
  
  if (!isAuthorized) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;