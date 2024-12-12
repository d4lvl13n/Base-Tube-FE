import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/common/Header';
import CreatorHubNav from './components/pages/CreatorHub/CreatorHubNav';
import ProtectedRoute from './components/pages/ProtectedRoute';
import HomePage from './components/pages/HomePage';
import SingleVideo from './components/pages/SingleVideo';
import DiscoveryPage from './components/pages/DiscoveryPage/index';
import SubscribedChannelPage from './components/pages/SubscribedChannelPage';
import NFTMarketplace from './components/pages/NFTMarketplace';
import UserProfileWallet from './components/pages/UserProfileWallet';
import SignInPage from './components/pages/SignInPage';
import SignUpPage from './components/pages/SignUpPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import ChannelPage from './components/pages/ChannelPage';
import ChannelDetailPage from './components/pages/ChannelDetailPage';
import CreateChannelPage from './components/pages/CreateChannelPage';
import ProfileSettings from './components/pages/ProfileSettings';
import CreatorHubLandingPage from './components/pages/CreatorHub/CreatorHubLandingPage';
import { ChannelProvider } from './context/ChannelContext';
import VideoUpload from './components/pages/CreatorHub/VideoUpload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AnalyticsPage from './components/pages/CreatorHub/Analytics/AnalyticsPage';
import { GrowthTab } from './components/pages/CreatorHub/Analytics/tabs/GrowthTab';
import { useAnalyticsContext } from './hooks/useAnalyticsData';
import CreatorResourcesPage from './components/common/CreatorHub/CreatorResourcesPage';
import { VideoProvider } from './contexts/VideoContext';
import { ConfigProvider } from './contexts/ConfigContext';
import './styles/prosemirror.css';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';

// Create a layout component for CreatorHub
const CreatorHubLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <ChannelSelectionProvider>
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
    </ChannelSelectionProvider>
  );
};

// Create an analytics wrapper for Creator Hub routes
const AnalyticsRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { prefetchAnalytics } = useAnalyticsContext();
  
  React.useEffect(() => {
    prefetchAnalytics('7d');
  }, [prefetchAnalytics]);

  return element;
};

// Update CreatorHubRoute to include analytics prefetching
const CreatorHubRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <ProtectedRoute>
    <CreatorHubLayout>
      <AnalyticsRoute element={element} />
    </CreatorHubLayout>
  </ProtectedRoute>
);

function App() {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
        staleTime: Infinity,
        gcTime: 10 * 60 * 1000,
      },
    },
  }), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <VideoProvider>
            <Router>
              <ChannelProvider>
                <Routes>
                  {/* Public routes that don't need channel context */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/discover" element={<DiscoveryPage />} />
                  <Route path="/video/:id" element={<SingleVideo />} />
                  <Route path="/nft-marketplace" element={<NFTMarketplace />} />

                  {/* Channel-related routes */}
                  <Route path="/channel/:identifier" element={<ChannelDetailPage />} />
                  <Route path="/channel" element={<ChannelPage />} />
                  
                  {/* Creator Hub routes with special layout */}
                  <Route
                    path="/creator-hub"
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
                  <Route
                    path="/creator-hub/analytics"
                    element={
                      <CreatorHubRoute
                        element={<AnalyticsPage />}
                      />
                    }
                  />
                  <Route
                    path="/creator-hub/analytics/growth"
                    element={
                      <CreatorHubRoute
                        element={<GrowthTab channelId={''} />}
                      />
                    }
                  />
                  <Route
                    path="/creator-hub/resources"
                    element={
                      <CreatorHubRoute
                        element={<CreatorResourcesPage />}
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
              <ReactQueryDevtools initialIsOpen={false} />
            </Router>
          </VideoProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;