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
  const authMethod = localStorage.getItem('auth_method') as AuthMethod;

  // Only check relevant loading state based on auth method
  const isLoading = authMethod === AuthMethod.WEB3 
    ? step === 'CONNECTING_WALLET' || step === 'CHECKING_NETWORK'
    : !isClerkLoaded;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const isAuthorized = authMethod === AuthMethod.WEB3 ? isAuthenticated : isSignedIn;

  if (!isAuthorized) {
    // Add debug logging
    console.log('Not authorized:', {
      authMethod,
      isAuthenticated,
      isSignedIn,
      currentPath: location.pathname
    });
    
    return <Navigate to={authMethod === AuthMethod.WEB3 ? "/sign-in-web3" : "/sign-in"} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;