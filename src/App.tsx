import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/pages/ProtectedRoute';
import HomePage from './components/pages/HomePage';
import SingleVideo from './components/pages/SingleVideo';
import DiscoveryPage from './components/pages/DiscoveryPage';
import SubscribedChannelPage from './components/pages/SubscribedChannelPage';
import NFTMarketplace from './components/pages/NFTMarketplace';
import UserProfileWallet from './components/pages/UserProfileWallet';
import SignInPage from './components/pages/SignInPage';
import SignUpPage from './components/pages/SignUpPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import ChannelPage from './components/pages/ChannelPage';
import ChannelDetailPage from './components/pages/ChannelDetailPage';
import DefaultVideoPage from './components/pages/DefaultVideoPage';
import CreateChannelPage from './components/pages/CreateChannelPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:id" element={<SingleVideo />} /> 
          <Route path="/discover" element={<DiscoveryPage />} />
          <Route path="/nft-marketplace" element={<NFTMarketplace />} />
          <Route path="/channel" element={<ChannelPage />} />
          <Route path="/channel/:id" element={<ChannelDetailPage />} />
          <Route path="/default-video/:id" element={<DefaultVideoPage />} />
          
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
          <Route
            path="/create-channel"
            element={
              <ProtectedRoute>
                <CreateChannelPage />
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
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ErrorBoundary>
  );
}

export default App;