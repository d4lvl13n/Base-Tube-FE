import React, { createContext, lazy, Suspense, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AuthenticationStep, type User, type LoginResponse } from '../types/auth';
import ErrorBoundary from '../components/common/ErrorBoundary';

export interface AuthContextType {
  step: AuthenticationStep;
  error: Error | null;
  isAuthenticated: boolean;
  user: User | null;
  isRestoring: boolean;
  setUser: (user: User | null) => void;
  isConnected: boolean;
  address: string | undefined;
  connect: () => Promise<LoginResponse | void>;
  disconnect: () => void;
  /** Load wallet support without replacing the application/provider tree. */
  enableWallet: () => void;
}
export type WalletAuthState = Omit<AuthContextType, 'enableWallet'>;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hasStoredWalletSession(): boolean {
  try { return localStorage.getItem('auth_method') === 'web3' && Boolean(localStorage.getItem('auth_user')); }
  catch { return false; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerk = useClerkAuth();
  const [storedSession] = useState(hasStoredWalletSession);
  const [enabled, setEnabled] = useState(storedSession);
  const [attempt, setAttempt] = useState(0);
  const [wallet, setWallet] = useState<WalletAuthState | null>(null);
  const engine = useRef<WalletAuthState | null>(null);
  const enableWallet = useCallback(() => setEnabled(true), []);
  const publish = useCallback((value: WalletAuthState) => { engine.current = value; setWallet(value); }, []);
  // A retry creates a fresh lazy boundary; a failed optional chunk never takes down public content.
  const Runtime = useMemo(() => lazy(() => import('./wallet/WalletAuthRuntime')), [attempt]);
  const initial = useMemo<WalletAuthState>(() => ({
    step: AuthenticationStep.IDLE, error: null, isAuthenticated: false, user: null,
    isRestoring: storedSession, isConnected: false, address: undefined,
    connect: async () => {
      enableWallet();
      if (engine.current) return engine.current.connect();
      throw new Error('Wallet is loading. Please try again.');
    },
    disconnect: () => engine.current?.disconnect(),
    setUser: user => { enableWallet(); engine.current?.setUser(user); },
  }), [enableWallet, storedSession]);
  const value = useMemo(() => ({ ...(wallet ?? initial), enableWallet }), [wallet, initial, enableWallet]);
  return <AuthContext.Provider value={value}>
    {children}
    {enabled && (storedSession || clerk.isLoaded !== false) && <ErrorBoundary key={attempt} fallback={
      <div role="alert" className="fixed bottom-4 left-4 z-50 rounded-lg bg-zinc-900 p-4 text-white">
        Wallet support could not load. <button className="text-orange-400 underline" onClick={() => setAttempt(n => n + 1)}>Retry wallet</button>
      </div>
    }><Suspense fallback={null}><Runtime onChange={publish} /></Suspense></ErrorBoundary>}
  </AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
export function isWeb3User(user: User): boolean { return user.web3auth !== undefined; }
