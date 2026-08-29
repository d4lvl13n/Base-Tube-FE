// src/index.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './index.css';
import '@coinbase/onchainkit/styles.css';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { PlaybackProvider } from './contexts/PlaybackContext';
import { DescriptionDockProvider } from './contexts/DescriptionDockContext';

import { Buffer } from 'buffer';

// Clerk
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-react';

// Wagmi / OnchainKit
import { WagmiProvider } from 'wagmi';
import { config as wagmiConfig } from './config/wagmi';
import { baseSepolia } from 'wagmi/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const ONCHAINKIT_API_KEY = process.env.REACT_APP_ONCHAINKIT_API_KEY;

if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');
if (!ONCHAINKIT_API_KEY) throw new Error('Missing OnchainKit API Key');

window.Buffer = window.Buffer || Buffer;

const queryClient = new QueryClient();

// GA4 page-view tracking for the SPA. The gtag snippet in public/index.html
// has send_page_view disabled; this fires one page_view per route change,
// including the initial load. No-op if gtag is blocked (ad blockers).
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
      });
    }
  }, [location]);
  return null;
}

// Invalidate caches on auth changes (web3 cookie or Clerk)
window.addEventListener('auth:unauthorized', () => {
  queryClient.invalidateQueries();
});

window.addEventListener('auth:rate-limited', () => {
  // No invalidation; informational only
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageViewTracker />
        <ChannelSelectionProvider>
            <WagmiProvider config={wagmiConfig}>
              <AuthProvider>
                <OnchainKitProvider
                  apiKey={ONCHAINKIT_API_KEY}
                  chain={baseSepolia}
                  config={{
                    appearance: {
                      name: 'Base.Tube',
                      logo: '/assets/basetubelogo.png',
                      mode: 'dark',
                      theme: 'hacker'
                    },
                    wallet: {
                      display: 'modal',
                      termsUrl: 'https://base.tube/terms',
                      privacyUrl: 'https://base.tube/privacy'
                    }
                  }}
                >
                  <RainbowKitProvider modalSize="wide">
                    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
                      <ClerkLoaded>
                        <PlaybackProvider>
                          <DescriptionDockProvider>
                            <App />
                          </DescriptionDockProvider>
                        </PlaybackProvider>
                      </ClerkLoaded>
                    </ClerkProvider>
                  </RainbowKitProvider>
                </OnchainKitProvider>
              </AuthProvider>
            </WagmiProvider>
        </ChannelSelectionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
