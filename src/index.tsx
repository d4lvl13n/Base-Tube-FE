// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@coinbase/onchainkit/styles.css';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

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

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const ONCHAINKIT_API_KEY = process.env.REACT_APP_ONCHAINKIT_API_KEY;

if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');
if (!ONCHAINKIT_API_KEY) throw new Error('Missing OnchainKit API Key');

window.Buffer = window.Buffer || Buffer;

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <OnchainKitProvider
        apiKey={ONCHAINKIT_API_KEY}
        chain={baseSepolia}
        config={{
          appearance: {
            name: 'Base.Tube',
            logo: '/assets/basetubelogo.png',
            mode: 'dark',
            theme: 'base'
          },
          wallet: {
            display: 'modal',
            termsUrl: 'https://base.tube/terms',
            privacyUrl: 'https://base.tube/privacy'
          }
        }}
      >
        <RainbowKitProvider modalSize="wide">
          <AuthProvider>
            <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
              <ClerkLoaded>
                <App />
              </ClerkLoaded>
            </ClerkProvider>
          </AuthProvider>
        </RainbowKitProvider>
      </OnchainKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);
