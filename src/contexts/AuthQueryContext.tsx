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
    setSession(previous => {
      if (previous.identity === identity) return previous;
      // Only Clerk-pending public reads are retained after resolving signed out. Every account
      // transition still gets a fresh client and a new mounted subtree.
      if (previous.identity === 'loading' && identity === 'anonymous') return { ...previous, identity };
      return sessionCache(identity, previous.generation + 1);
    });
  }, []);

  useEffect(() => {
    const client = session.client;
    return () => {
      void client.cancelQueries();
      queueMicrotask(() => client.clear());
    };
  }, [session.client]);

  useEffect(() => {
    const reset = () => setSession(previous =>
      previous.identity === 'anonymous' || previous.identity === 'loading'
        ? previous
        : sessionCache(previous.identity, previous.generation + 1));
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
  const resolvingAnonymous = session.identity === 'loading' && identity === 'anonymous';
  if (identity !== session.identity && !resolvingAnonymous) return null;
  return <React.Fragment key={session.generation}>{children}</React.Fragment>;
}

export function AuthCacheBoundary({ children }: { children: React.ReactNode }) {
  const clerk = useClerkAuth();
  const web3 = useAuth();
  const walletSession = localStorage.getItem('auth_method') === 'web3';
  // Wallet cookies can personalize reads before local restoration finishes. Those
  // provisional reads must be discarded even if restoration resolves signed out.
  const identity = walletSession && web3.isRestoring
    ? 'loading:wallet'
    : walletSession && web3.isAuthenticated && web3.user
      ? `web3:${web3.user.id}`
      : clerk.isLoaded === false ? 'loading'
        : clerk.userId ? `clerk:${clerk.userId}:${clerk.sessionId}` : 'anonymous';
  return <QueryIdentityBoundary identity={identity}>{children}</QueryIdentityBoundary>;
}
