import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ProtectedRoute from './components/pages/ProtectedRoute';
import HomePage from './components/pages/HomePage';
import VideoPage from './components/pages/VideoPage';
import DiscoveryPage from './components/pages/DiscoveryPage';
import SubscribedChannelPage from './components/pages/SubscribedChannelPage';
import NFTMarketplace from './components/pages/NFTMarketplace';
import UserProfileWallet from './components/pages/UserProfileWallet';
import SignInPage from './components/pages/SignInPage';
import SignUpPage from './components/pages/SignUpPage';
import ErrorBoundary from './components/common/ErrorBoundary'; // Ensure this path is correct
import ChannelPage from './components/pages/ChannelPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:id" element={<VideoPage />} />
          <Route path="/discover" element={<DiscoveryPage />} />
          <Route path="/nft-marketplace" element={<NFTMarketplace />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
          <Route path="/channel" element={<ChannelPage />} />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfileWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscribed"
            element={
              <ProtectedRoute>
                <SubscribedChannelPage />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route
            path="/sign-in/*"
            element={
              <SignedOut>
                <SignInPage />
              </SignedOut>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <SignedOut>
                <SignUpPage />
              </SignedOut>
            }
          />

          {/* Catch-all redirect to sign-in */}
          <Route
            path="*"
            element={
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;