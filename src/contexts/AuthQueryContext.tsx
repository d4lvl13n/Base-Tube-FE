import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { hashKey, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from './AuthContext';

function sessionCache(identity: string, generation: number) {
  return {
    identity,
    generation,
    client: new QueryClient({ defaultOptions: { queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
      queryKeyHashFn: key => hashKey([identity, generation, key]),
    } } }),
  };
}

const AuthQueryContext = createContext<{
  identity: string;
  generation: number;
  selectIdentity: (identity: string) => void;
} | null>(null);

export function AuthQueryProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(() => sessionCache('loading', 0));
  const selectIdentity = useCallback((identity: string) => {
    setSession(previous => previous.identity === identity ? previous : sessionCache(identity, previous.generation + 1));
  }, []);

  useEffect(() => {
    const client = session.client;
    return () => {
      void client.cancelQueries();
      queueMicrotask(() => client.clear());
    };
  }, [session.client]);

  useEffect(() => {
    const reset = () => setSession(previous => sessionCache(previous.identity, previous.generation + 1));
    window.addEventListener('auth:unauthorized', reset);
    return () => window.removeEventListener('auth:unauthorized', reset);
  }, []);

  return (
    <AuthQueryContext.Provider value={{ identity: session.identity, generation: session.generation, selectIdentity }}>
      <QueryClientProvider client={session.client}>{children}</QueryClientProvider>
    </AuthQueryContext.Provider>
  );
}

export function QueryIdentityBoundary({ identity, children }: { identity: string; children: React.ReactNode }) {
  const session = useContext(AuthQueryContext);
  if (!session) throw new Error('QueryIdentityBoundary requires AuthQueryProvider');
  const { selectIdentity } = session;
  useLayoutEffect(() => { selectIdentity(identity); }, [identity, selectIdentity]);
  // Do not render even one frame with a previous identity's cache or local state.
  if (identity !== session.identity) return null;
  return <React.Fragment key={`${identity}:${session.generation}`}>{children}</React.Fragment>;
}

export function AuthCacheBoundary({ children }: { children: React.ReactNode }) {
  const clerk = useClerkAuth();
  const web3 = useAuth();
  const identity = localStorage.getItem('auth_method') === 'web3' && web3.isAuthenticated && web3.user
    ? `web3:${web3.user.id}`
    : clerk.userId ? `clerk:${clerk.userId}:${clerk.sessionId}` : 'anonymous';
  return <QueryIdentityBoundary identity={identity}>{children}</QueryIdentityBoundary>;
}
