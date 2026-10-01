// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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

import { AuthQueryProvider, AuthCacheBoundary } from './contexts/AuthQueryContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const ONCHAINKIT_API_KEY = process.env.REACT_APP_ONCHAINKIT_API_KEY;

if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');
if (!ONCHAINKIT_API_KEY) throw new Error('Missing OnchainKit API Key');

window.Buffer = window.Buffer || Buffer;


// GA4 page views are GA4's own: the first load (public/index.html) and every route change
// (the stream's enhanced measurement follows browser history), as on base.tube.

window.addEventListener('auth:rate-limited', () => {
  // No invalidation; informational only
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthQueryProvider>
      <BrowserRouter>
          <NavigationProvider>
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
                        <AuthCacheBoundary>
                        <ChannelSelectionProvider>
                        <PlaybackProvider>
                          <DescriptionDockProvider>
                            <App />
                          </DescriptionDockProvider>
                        </PlaybackProvider>
                        </ChannelSelectionProvider>
                        </AuthCacheBoundary>
                      </ClerkLoaded>
                    </ClerkProvider>
                  </RainbowKitProvider>
                </OnchainKitProvider>
              </AuthProvider>
            </WagmiProvider>
          </NavigationProvider>
      </BrowserRouter>
    </AuthQueryProvider>
  </React.StrictMode>
);
