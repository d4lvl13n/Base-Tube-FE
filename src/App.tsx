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
import SubscribedChannelPage from './components/pages/SubscribedChannelPage/index';
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
import { NavigationProvider } from './contexts/NavigationContext';
import VideosManagement from './components/pages/CreatorHub/VideosManagement';
import ChannelManagement from './components/pages/CreatorHub/ChannelManagement';
import { SystemHealth } from './health/SystemHealth';
import { ContentStudio } from './components/pages/CreatorHub/ContentStudio/index';
import ChannelList from './components/pages/CreatorHub/ChannelManagement/ChannelList';
import OnboardingModal from './components/pages/OnboardingModal';
import { AuthProvider } from './contexts/AuthContext';
import SignInWeb3 from './components/pages/SignInWeb3';
import OnboardingWeb3 from './components/pages/OnboardingWeb3';

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

// Update CreatorHubRoute to include monitoring routes
const CreatorHubRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <ProtectedRoute>
    <CreatorHubLayout>
      <AnalyticsRoute element={element} />
    </CreatorHubLayout>
  </ProtectedRoute>
);

// Add a simpler layout for monitoring
const MonitoringLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#09090B]">
    <Header className="sticky top-0 z-50" />
    {children}
  </div>
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
            <AuthProvider>
              <Router>
                <ChannelProvider>
                  <NavigationProvider>
                    <div className="min-h-screen bg-black">
                      <Routes>
                        {/* Public routes that don't need channel context */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/discover" element={<DiscoveryPage />} />
                        <Route path="/video/:id" element={<SingleVideo />} />
                        <Route path="/nft-marketplace" element={<NFTMarketplace />} />

                        {/* Channel-related routes */}
                        <Route path="/channel/:identifier" element={<ChannelDetailPage />} />
                        <Route path="/channel" element={<ChannelPage />} />
                        
                        {/* Move monitoring routes here, before creator hub routes */}
                        <Route
                          path="/monitoring"
                          element={
                            <ProtectedRoute>
                              <MonitoringLayout>
                                <SystemHealth />
                              </MonitoringLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/monitoring/queue"
                          element={
                            <ProtectedRoute>
                              <MonitoringLayout>
                                <SystemHealth refreshInterval={5000} />
                              </MonitoringLayout>
                            </ProtectedRoute>
                          }
                        />

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
                        <Route
                          path="/creator-hub/videos"
                          element={
                            <CreatorHubRoute
                              element={<VideosManagement />}
                            />
                          }
                        />
                        <Route
                          path="/creator-hub/channels"
                          element={
                            <CreatorHubRoute
                              element={<ChannelList />}
                            />
                          }
                        />
                        <Route
                          path="/creator-hub/channels/:channelId"
                          element={
                            <CreatorHubRoute
                              element={<ChannelManagement />}
                            />
                          }
                        />
                        <Route
                          path="/creator-hub/content-studio"
                          element={
                            <CreatorHubRoute
                              element={
                                <ChannelSelectionProvider>
                                  <ContentStudio />
                                </ChannelSelectionProvider>
                              }
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
                        <Route
                          path="/sign-in-web3"
                          element={<SignInWeb3 />}
                        />
                        <Route
                          path="/onboarding"
                          element={
                            <ProtectedRoute>
                              <OnboardingModal />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/onboarding/web3"
                          element={
                            <ProtectedRoute>
                              <OnboardingWeb3 />
                            </ProtectedRoute>
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
                      <ToastContainer />
                      <ReactQueryDevtools initialIsOpen={false} />
                    </div>
                  </NavigationProvider>
                </ChannelProvider>
              </Router>
            </AuthProvider>
          </VideoProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;