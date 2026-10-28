import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/common/Header';
import CreatorHubShell from './components/pages/CreatorHub/CreatorHubShell';
import ProtectedRoute from './components/pages/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loader from './components/common/Loader';
import ReferralAttributionBridge from './components/common/ReferralAttributionBridge';
import CryptoResumeBridge from './components/common/CryptoResumeBridge';
import StudioFunnelBridge from './components/common/StudioFunnelBridge';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAnalyticsContext } from './hooks/useAnalyticsData';
import { VideoProvider } from './contexts/VideoContext';
import { ConfigProvider } from './contexts/ConfigContext';
import './styles/prosemirror.css';
import MiniPlayer from './components/common/Video/MiniPlayer/MiniPlayer';
import DescriptionDock from './components/common/Video/DescriptionDock/DescriptionDock';
import { ChannelSelectionProvider } from './contexts/ChannelSelectionContext';
import { SystemHealth } from './health/SystemHealth';
import { GrowthTab } from './components/pages/CreatorHub/Analytics/tabs/GrowthMonetizationTab';
import { TermsPage, PrivacyPage, RefundPage } from './pages/legal/LegalStubs';
import { ManagePassesPage } from './components/pages/CreatorHub/ManagePasses';
import { PassDetailView } from './components/pages/CreatorHub/ManagePasses';
import LandingMoved from './components/pages/ThumbnailLanding/LandingMoved';
import { AIThumbnailsSignInPage, AIThumbnailsSignUpPage } from './components/pages/CTREngine/auth/AIThumbnailsAuthPage';
import AIThumbnailsAuthContinue from './components/pages/CTREngine/auth/AIThumbnailsAuthContinue';
import { UploadQueueProvider } from './contexts/UploadQueueContext';

// Route pages load only when visited, keeping account screens small on slow connections.
const V2HomePage = lazy(() => import('./components/pages/V2HomePage'));
const SingleVideo = lazy(() => import('./components/pages/SingleVideo'));
const DiscoveryPage = lazy(() => import('./components/pages/DiscoveryPage/index'));
const SearchPage = lazy(() => import('./components/pages/SearchPage'));
const SubscribedChannelPage = lazy(() => import('./components/pages/SubscribedChannelPage/index'));
const NFTMarketplace = lazy(() => import('./components/pages/NFTMarketplace'));
const UserProfileWallet = lazy(() => import('./components/pages/UserProfileWallet'));
const SignInPage = lazy(() => import('./components/pages/SignInPage'));
const SignUpPage = lazy(() => import('./components/pages/SignUpPage'));
const ChannelPage = lazy(() => import('./components/pages/ChannelPage'));
const ChannelDetailPage = lazy(() => import('./components/pages/ChannelDetailPage'));
const CreateChannelPage = lazy(() => import('./components/pages/CreateChannelPage'));
const ProfileSettings = lazy(() => import('./components/pages/ProfileSettings'));
const CreatorHubLandingPage = lazy(() => import('./components/pages/CreatorHub/CreatorHubLandingPage'));
const UploadEntry = lazy(() => import('./components/pages/CreatorHub/UploadEntry'));
const AnalyticsPage = lazy(() => import('./components/pages/CreatorHub/Analytics/AnalyticsPage'));
const CreatorResourcesPage = lazy(() => import('./components/common/CreatorHub/CreatorResourcesPage'));
const VideosManagement = lazy(() => import('./components/pages/CreatorHub/VideosManagement'));
const ChannelManagement = lazy(() => import('./components/pages/CreatorHub/ChannelManagement'));
const ChannelList = lazy(() => import('./components/pages/CreatorHub/ChannelManagement/ChannelList'));
const OnboardingModal = lazy(() => import('./components/pages/OnboardingModal'));
const SignInWeb3 = lazy(() => import('./components/pages/SignInWeb3'));
const OnboardingWeb3 = lazy(() => import('./components/pages/OnboardingWeb3'));
const NFTSimulator = lazy(() => import('./components/pages/NftContentPass/NFTCPsimulator/NftContentPassSimulator'));
const MonetizationInfo = lazy(() => import('./components/pages/CreatorHub/MonetizationInfo'));
const Leaderboard = lazy(() => import('./components/pages/Leaderboard/Index'));
const EmbedVideo = lazy(() => import('./components/pages/EmbedVideo'));
const FAQPage = lazy(() => import('./pages/FAQ/index'));
const MomentNFTsPage = lazy(() => import('./pages/FAQ/MomentNFTs'));
const MomentNFTMintPage = lazy(() => import('./pages/MomentNFTMint'));
const PassDetailsPage = lazy(() => import('./pages/PassDetailsPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const CreditsSuccessPage = lazy(() => import('./pages/CreditsSuccessPage'));
const WatchPassPage = lazy(() => import('./pages/WatchPassPage'));
const MyPasses = lazy(() => import('./components/pages/MyPasses'));
const YouTubeAuthCallback = lazy(() => import('./components/pages/CreatorHub/YouTubeAuthCallback'));
const LandingPage = lazy(() => import('./components/pages/landingPage'));
const AuditHistoryPage = lazy(() => import('./components/pages/CTREngine/AuditHistoryPage'));
const CTRAuditPage = lazy(() => import('./components/pages/CTREngine/AuditPage'));
const CTRChannelAuditPage = lazy(() => import('./components/pages/CTREngine/ChannelAuditPage'));
const CTRGeneratePage = lazy(() => import('./components/pages/CTREngine/GeneratePage'));
const CTRSettingsPage = lazy(() => import('./components/pages/CTREngine/SettingsPage'));
const CTRGalleryPage = lazy(() => import('./components/pages/CTREngine/GalleryPage'));

// Lazy-loaded components
const ThumbnailGalleryPage = lazy(() => import('./pages/thumbnail-gallery'));
const CreateContentPass = lazy(() => import('./components/pages/CreatorHub/CreateContentPass/index'));
const StudioProjectsPage = lazy(() => import('./components/pages/CTREngine/StudioProjectsPage'));
const StudioProjectPage = lazy(() => import('./components/pages/CTREngine/StudioProjectPage'));
const StudioProfilesPage = lazy(() => import('./components/pages/CTREngine/StudioProfilesPage'));
const StudioBatchReview = lazy(() => import('./components/pages/CTREngine/StudioBatchReview'));
const AIThumbnailsPricingPage = lazy(() => import('./components/pages/CTREngine/PricingPage'));
const AIThumbnailsBillingSuccessPage = lazy(() => import('./components/pages/CTREngine/BillingSuccessPage'));

// Create a layout component for CreatorHub
const CreatorHubLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChannelSelectionProvider>
    <CreatorHubShell>{children}</CreatorHubShell>
  </ChannelSelectionProvider>
);

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

const AuthRouteAliasRedirect: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

const studioPage = (page: React.ReactElement) => (
  <Suspense fallback={<div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400">Loading...</div>}>
    {page}
  </Suspense>
);

/** `/ai-thumbnails/studio/*` was the first name of the projects routes; keep old links working. */
const StudioRouteRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`${location.pathname.replace(/^\/ai-thumbnails\/studio/, '/ai-thumbnails/projects')}${location.search}`} state={location.state} replace />;
};

const isInternalMonitoringEnabled = process.env.REACT_APP_ENABLE_INTERNAL_MONITORING === 'true';

function App() {
  return (
    <ErrorBoundary>
        <ConfigProvider>
          <VideoProvider>
              <UploadQueueProvider>
              <div className="min-h-screen bg-black">
                <ReferralAttributionBridge />
                <CryptoResumeBridge />
                {/* AI Thumbnails account gate and welcome credits: above the routes, so sign-in never unmounts them. */}
                <StudioFunnelBridge />
                <Suspense fallback={<Loader fullPage label="Loading your workspace…" />}>
                <Routes>
                  {/* Public routes that don't need channel context */}
                  <Route path="/" element={<V2HomePage />} />
                  {/* Legal (Phase C placeholders — replace with counsel-reviewed content).
                      Paths match the existing footer links (/privacy, /terms). */}
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/refund" element={<RefundPage />} />
                  <Route path="/v2" element={<V2HomePage />} />
                  <Route path="/signup" element={<AuthRouteAliasRedirect to="/sign-up" />} />
                  <Route path="/signin" element={<AuthRouteAliasRedirect to="/sign-in" />} />
                  <Route path="/discover" element={<DiscoveryPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/video/:id" element={<SingleVideo />} />
                  <Route path="/nft-marketplace" element={<NFTMarketplace />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />

                  {/* AI Thumbnail Landing Page */}
                  <Route path="/ai-thumbnails" element={<LandingMoved />} />

                  {/* AI Thumbnails' own sign-in and sign-up (Clerk's steps are sub-paths), and the
                      one address they all end on. base.tube's /sign-in, /sign-up and onboarding are separate. */}
                  <Route path="/ai-thumbnails/sign-in/*" element={<AIThumbnailsSignInPage />} />
                  <Route path="/ai-thumbnails/sign-up/*" element={<AIThumbnailsSignUpPage />} />
                  <Route path="/ai-thumbnails/auth/continue" element={<AIThumbnailsAuthContinue />} />

                  {/* CTR Thumbnail Engine Routes (under ai-thumbnails namespace) */}
                  <Route path="/ai-thumbnails/creative" element={<Navigate to="/ai-thumbnails/generate" replace />} />
                  <Route path="/ai-thumbnails/audit" element={<CTRAuditPage />} />
                  <Route path="/ai-thumbnails/channel-audit" element={<CTRChannelAuditPage />} />
                  <Route path="/ai-thumbnails/generate" element={<CTRGeneratePage />} />
                  <Route path="/ai-thumbnails/projects" element={studioPage(<StudioProjectsPage />)} />
                  <Route path="/ai-thumbnails/projects/profiles" element={studioPage(<StudioProfilesPage />)} />
                  <Route path="/ai-thumbnails/projects/batch" element={studioPage(<StudioBatchReview />)} />
                  <Route path="/ai-thumbnails/projects/:projectId" element={studioPage(<StudioProjectPage />)} />
                  <Route path="/ai-thumbnails/studio/*" element={<StudioRouteRedirect />} />
                  <Route path="/ai-thumbnails/gallery" element={<CTRGalleryPage />} />
                  <Route path="/ai-thumbnails/history" element={<AuditHistoryPage />} />
                  <Route path="/ai-thumbnails/settings" element={<CTRSettingsPage />} />
                  <Route path="/ai-thumbnails/settings/:section" element={<CTRSettingsPage />} />
                  {/* Monthly plans (videos per month) and the return from their Stripe Checkout. */}
                  <Route path="/ai-thumbnails/pricing" element={studioPage(<AIThumbnailsPricingPage />)} />
                  <Route path="/ai-thumbnails/billing/success" element={studioPage(<AIThumbnailsBillingSuccessPage />)} />

                  {/* Content Pass Landing Page */}
                  <Route path="/content-passes" element={<LandingPage />} />

                  {/* Channel-related routes */}
                  <Route path="/channel/:identifier" element={<ChannelDetailPage />} />
                  <Route path="/channel" element={<ChannelPage />} />
                  
                  {/* Move monitoring routes here, before creator hub routes */}
                  {isInternalMonitoringEnabled && (
                    <>
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
                    </>
                  )}

                  {/* Creator Hub routes with special layout */}
                  <Route
                    path="/creator-hub"
                    element={
                      <CreatorHubRoute
                        element={<CreatorHubLandingPage />}
                      />
                    }
                  />
                  {/* Upload entry points: the old addresses and the workspace's own
                      all open the single upload workspace (UP-UX §4). */}
                  <Route
                    path="/creator-hub/upload"
                    element={<CreatorHubRoute element={<UploadEntry />} />}
                  />
                  <Route
                    path="/creator-hub/uploads"
                    element={<CreatorHubRoute element={<UploadEntry />} />}
                  />
                  <Route
                    path="/creator-hub/uploads/:draftId"
                    element={<CreatorHubRoute element={<UploadEntry />} />}
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
                    element={<CreatorHubRoute element={<UploadEntry />} />}
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

                  {/* Credit checkout return (separate from the NFT-pass /pay/success flow) */}
                  <Route path="/credits/success" element={<CreditsSuccessPage />} />
                  <Route path="/credits/cancel" element={<Navigate to="/ai-thumbnails/generate" replace />} />
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
                </Suspense>
                <DescriptionDock />
                <MiniPlayer />
                <ToastContainer />
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
              </UploadQueueProvider>
          </VideoProvider>
        </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
