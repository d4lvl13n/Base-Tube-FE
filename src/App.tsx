import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/common/Header';
import CreatorHubNav from './components/pages/CreatorHub/CreatorHubNav';
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
import ProfileSettings from './components/pages/ProfileSettings';
import CreatorHubLandingPage from './components/pages/CreatorHub/CreatorHubLandingPage';
import { ChannelProvider } from './context/ChannelContext';
import VideoUpload from './components/pages/CreatorHub/VideoUpload';

// Create a layout component for CreatorHub
const CreatorHubLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Header 
        isNavOpen={isNavOpen} 
        onNavToggle={() => setIsNavOpen(!isNavOpen)}
        className="sticky top-0 z-50" 
      />
      <div className="flex">
        <CreatorHubNav 
          isCollapsed={!isNavOpen} 
          onToggle={() => setIsNavOpen(!isNavOpen)} 
        />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

// Create a wrapper component for routes that need the CreatorHub layout
const CreatorHubRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <ProtectedRoute>
    <CreatorHubLayout>
      {element}
    </CreatorHubLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ChannelProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/video/:id" element={<SingleVideo />} />
            <Route path="/discover" element={<DiscoveryPage />} />
            <Route path="/nft-marketplace" element={<NFTMarketplace />} />
            <Route path="/channel" element={<ChannelPage />} />
            <Route path="/channel/:id" element={<ChannelDetailPage />} />
            <Route path="/default-video/:id" element={<DefaultVideoPage />} />

            {/* Creator Hub routes with special layout */}
            <Route
              path="/creator-hub/*"
              element={
                <CreatorHubRoute
                  element={<CreatorHubLandingPage />}
                />
              }
            />
            <Route
              path="/creator-hub/upload"
              element={
                <CreatorHubRoute
                  element={<VideoUpload />}
                />
              }
            />

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

            {/* Profile settings route */}
            <Route
              path="/profile/settings"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
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
        </ChannelProvider>
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