import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Buffer } from 'buffer';
import './index.css';
import App from './App';
import { AuthQueryProvider, AuthCacheBoundary } from './contexts/AuthQueryContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';
import { PlaybackProvider } from './contexts/PlaybackContext';
import { DescriptionDockProvider } from './contexts/DescriptionDockContext';
import { startBrowserPerformance } from './performance/browserPerformance';
import { PerformanceRouteObserver } from './performance/PerformanceRouteObserver';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');
window.Buffer = window.Buffer || Buffer;

// Public content renders while Clerk initializes. Private routes guard their own pending identity.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthQueryProvider>
      <BrowserRouter>
        <PerformanceRouteObserver />
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <NavigationProvider>
            <AuthProvider>
              <AuthCacheBoundary>
                <ChannelSelectionProvider>
                  <PlaybackProvider>
                    <DescriptionDockProvider><App /></DescriptionDockProvider>
                  </PlaybackProvider>
                </ChannelSelectionProvider>
              </AuthCacheBoundary>
            </AuthProvider>
          </NavigationProvider>
        </ClerkProvider>
      </BrowserRouter>
    </AuthQueryProvider>
  </React.StrictMode>
);
startBrowserPerformance();
