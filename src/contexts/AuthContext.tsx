import React, { createContext, useContext } from 'react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { 
  AuthenticationStep, 
  User, 
  LoginResponse, 
} from '../types/auth';

interface AuthContextType {
  // Authentication State
  step: AuthenticationStep;
  error: Error | null;
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;

  // Wallet State
  isConnected: boolean;
  address: string | undefined;

  // Actions
  connect: () => Promise<LoginResponse | void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    // Authentication State
    step,
    error,
    isAuthenticated,
    user,
    setUser,
    
    // Wallet State
    isConnected,
    address,
    
    // Actions
    connect,
    disconnect
  } = useWeb3Auth();

  const value: AuthContextType = {
    // Authentication State
    step,
    error,
    isAuthenticated,
    user,
    setUser,
    
    // Wallet State
    isConnected,
    address,
    
    // Actions
    connect,
    disconnect
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Optional: Type guard for checking web3 authentication
export function isWeb3User(user: User): boolean {
  return user.web3auth !== undefined;
}