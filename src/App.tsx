import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/common/Header';
import CreatorHubNav from './components/pages/CreatorHub/CreatorHubNav';
import ProtectedRoute from './components/pages/ProtectedRoute';
import HomePage from './components/pages/HomePage';
import SingleVideo from './components/pages/SingleVideo';
import DiscoveryPage from './components/pages/DiscoveryPage/index';
import SearchPage from './components/pages/SearchPage';
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
import VideoUpload from './components/pages/CreatorHub/VideoUpload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AnalyticsPage from './components/pages/CreatorHub/Analytics/AnalyticsPage';
import { useAnalyticsContext } from './hooks/useAnalyticsData';
import CreatorResourcesPage from './components/common/CreatorHub/CreatorResourcesPage';
import { VideoProvider } from './contexts/VideoContext';
import { ConfigProvider } from './contexts/ConfigContext';
import './styles/prosemirror.css';
import MiniPlayer from './components/common/Video/MiniPlayer/MiniPlayer';
import DescriptionDock from './components/common/Video/DescriptionDock/DescriptionDock';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';
import VideosManagement from './components/pages/CreatorHub/VideosManagement';
import ChannelManagement from './components/pages/CreatorHub/ChannelManagement';
import { SystemHealth } from './health/SystemHealth';
import { ContentStudio } from './components/pages/CreatorHub/ContentStudio/index';
import ChannelList from './components/pages/CreatorHub/ChannelManagement/ChannelList';
import OnboardingModal from './components/pages/OnboardingModal';
import { AuthProvider } from './contexts/AuthContext';
import SignInWeb3 from './components/pages/SignInWeb3';
import OnboardingWeb3 from './components/pages/OnboardingWeb3';
import NFTSimulator from './components/pages/NftContentPass/NFTCPsimulator/NftContentPassSimulator';
import MonetizationInfo from './components/pages/CreatorHub/MonetizationInfo';
import Leaderboard from './components/pages/Leaderboard/Index';
import EmbedVideo from './components/pages/EmbedVideo';
import FAQPage from './pages/FAQ/index';
import MomentNFTsPage from './pages/FAQ/MomentNFTs';
import MomentNFTMintPage from './pages/MomentNFTMint';
import { GrowthTab } from './components/pages/CreatorHub/Analytics/tabs/GrowthMonetizationTab';
import PassDetailsPage from './pages/PassDetailsPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import WatchPassPage from './pages/WatchPassPage';
import { ManagePassesPage } from './components/pages/CreatorHub/ManagePasses';
import { PassDetailView } from './components/pages/CreatorHub/ManagePasses';
import MyPasses from './components/pages/MyPasses';
import YouTubeAuthCallback from './components/pages/CreatorHub/YouTubeAuthCallback';
import LandingPage from './components/pages/landingPage';
import ThumbnailLanding from './components/pages/ThumbnailLanding';

// Lazy-loaded components
const ThumbnailGalleryPage = lazy(() => import('./pages/thumbnail-gallery'));
const CreateContentPass = lazy(() => import('./components/pages/CreatorHub/CreateContentPass/index'));

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
  const { prefetchCreatorAnalytics } = useAnalyticsContext();
  
  React.useEffect(() => {
    prefetchCreatorAnalytics('7d');
  }, [prefetchCreatorAnalytics]);

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
              <div className="min-h-screen bg-black">
                <Routes>
                  {/* Public routes that don't need channel context */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/discover" element={<DiscoveryPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/video/:id" element={<SingleVideo />} />
                  <Route path="/nft-marketplace" element={<NFTMarketplace />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />

                  {/* AI Thumbnail Landing Page */}
                  <Route path="/ai-thumbnails" element={<ThumbnailLanding />} />

                  {/* Content Pass Landing Page */}
                  <Route path="/content-passes" element={<LandingPage />} />

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
                  <Route
                    path="/creator-hub/nft-simulator"
                    element={
                      <CreatorHubRoute
                        element={<NFTSimulator />}
                      />
                    }
                  />
                  <Route
                    path="/creator-hub/monetization"
                    element={<MonetizationInfo />}
                  />
                  <Route
                    path="/creator-hub/create-content-pass"
                    element={
                      <CreatorHubRoute
                        element={
                          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                            <CreateContentPass />
                          </Suspense>
                        }
                      />
                    }
                  />
                  <Route
                    path="/creator-hub/passes"
                    element={
                      <CreatorHubRoute
                        element={<ManagePassesPage />}
                      />
                    }
                  />
                  <Route
                    path="/creator-hub/passes/:id"
                    element={
                      <CreatorHubRoute
                        element={<PassDetailView />}
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

                  {/* Public embed route - must be outside auth wrapper */}
                  <Route 
                    path="/embed/:videoId" 
                    element={<EmbedVideo />} 
                  />

                  {/* Add the new MomentNFTMint route before the FAQ routes */}
                  <Route
                    path="/mint/moment-nft"
                    element={
                      <ProtectedRoute>
                        <MomentNFTMintPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Thumbnail Gallery route */}
                  <Route path="/thumbnail-gallery" element={
                    <div className="min-h-screen bg-black">
                      <Header className="sticky top-0 z-50" />
                      <div className="pt-16">
                        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                          <ThumbnailGalleryPage />
                        </Suspense>
                      </div>
                    </div>
                  } />

                  {/* FAQ routes */}
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/faq/moment-nfts" element={<MomentNFTsPage />} />
                  <Route path="/faq/points-system" element={<div>Coming Soon</div>} />
                  <Route path="/faq/wallet" element={<div>Coming Soon</div>} />
                  <Route path="/faq/content-creation" element={<div>Coming Soon</div>} />

                  {/* New routes */}
                  <Route path="/p/:slug" element={<PassDetailsPage />} />
                  <Route path="/pay/success" element={<CheckoutSuccessPage />} />
                  <Route path="/watch/:passId" element={<WatchPassPage />} />

                  {/* MyPasses route */}
                  <Route
                    path="/my-passes"
                    element={
                      <ProtectedRoute>
                        <MyPasses />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard route */}
                  <Route
                    path="/dashboard/creator"
                    element={<YouTubeAuthCallback />}
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
                <DescriptionDock />
                <MiniPlayer />
                <ToastContainer />
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            </AuthProvider>
          </VideoProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;