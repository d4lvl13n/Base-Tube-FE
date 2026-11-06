import React, { useLayoutEffect, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { config } from '../../config/wagmi';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import type { WalletAuthState } from '../AuthContext';

function WalletSession({ onChange }: { onChange: (value: WalletAuthState) => void }) {
  const clerk = useClerkAuth();
  const auth = useWeb3Auth({ isClerkAuthenticated: clerk.isSignedIn === true, isClerkPending: clerk.isLoaded === false });
  const { step, error, isAuthenticated, user, isRestoring, setUser, isConnected, address, connect, disconnect } = auth;
  const value = useMemo(() => ({ step, error, isAuthenticated, user, isRestoring, setUser, isConnected, address, connect, disconnect }),
    [step, error, isAuthenticated, user, isRestoring, setUser, isConnected, address, connect, disconnect]);
  useLayoutEffect(() => { onChange(value); }, [onChange, value]);
  return null;
}

/** Shares the singleton wagmi store with UI islands, but owns the auth session exactly once. */
export default function WalletAuthRuntime({ onChange }: { onChange: (value: WalletAuthState) => void }) {
  return <WagmiProvider config={config}><WalletSession onChange={onChange} /></WagmiProvider>;
}
