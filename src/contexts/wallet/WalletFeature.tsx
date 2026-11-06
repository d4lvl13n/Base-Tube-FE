import React, { createContext, lazy, Suspense, useContext, useMemo, useState } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import Loader from '../../components/common/Loader';

const WalletFeatureContext = createContext(false);
export function WalletFeature({ children, fallback, onRetry }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}) {
  const alreadyInside = useContext(WalletFeatureContext);
  const [attempt, setAttempt] = useState(0);
  const Providers = useMemo(() => lazy(() => import('./WalletProviders')), [attempt]);
  return <ErrorBoundary key={attempt} fallback={
    <div role="alert" className="rounded-lg bg-zinc-900 p-4 text-white">Wallet support could not load. <button className="text-orange-400 underline" onClick={() => { onRetry?.(); setAttempt(n => n + 1); }}>Retry wallet</button></div>
  }><Suspense fallback={fallback ?? <Loader label="Loading wallet…" />}>
    {alreadyInside ? children : <Providers><WalletFeatureContext.Provider value={true}>{children}</WalletFeatureContext.Provider></Providers>}
  </Suspense></ErrorBoundary>;
}
