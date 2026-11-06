import React, { lazy, Suspense, useState } from 'react';
import { useStudioAccountState } from '../../hooks/useStudioAccount';
import { readCryptoCheckoutContext } from '../../utils/checkoutStorage';
import ErrorBoundary from './ErrorBoundary';
const Runtime = lazy(() => import('./CryptoResumeRuntime'));
export default function CryptoResumeBridge() {
  const [pending] = useState(() => Boolean(readCryptoCheckoutContext()));
  const { resolved, account } = useStudioAccountState();
  if (!pending || !resolved || account === 'anonymous') return null;
  return <ErrorBoundary fallback={<span role="alert">Purchase recovery could not load. Reload to retry.</span>}>
    <Suspense fallback={null}><Runtime /></Suspense>
  </ErrorBoundary>;
}
