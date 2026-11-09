import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearSubscriptionCheckout, subscriptionCheckoutReturn } from '../../utils/subscriptionCheckoutReturn';

/** Keep browser Back from reopening auth/continue or showing a project without trial credits. */
export default function SubscriptionCheckoutReturn({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [destination, setDestination] = useState(subscriptionCheckoutReturn);
  const returned = pathname === '/ai-thumbnails/pricing' || pathname === '/ai-thumbnails/billing/success';
  useEffect(() => {
    const onPageShow = () => setDestination(subscriptionCheckoutReturn());
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);
  useEffect(() => {
    if (destination && returned) {
      clearSubscriptionCheckout();
      setDestination(null);
    }
  }, [destination, returned]);
  // Success must reach its webhook-confirmation screen and retain its original brief destination.
  if (destination && !returned) return <Navigate to={destination} replace />;
  return <>{children}</>;
}
