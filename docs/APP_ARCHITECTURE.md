# Base.Tube App Architecture Documentation

## 📋 Table of Contents
1. [Application Overview](#application-overview)
2. [Routing Structure](#routing-structure)
3. [Layout Components](#layout-components)
4. [Context Providers](#context-providers)
5. [Protected Routes](#protected-routes)
6. [Code Organization](#code-organization)
7. [Performance Optimizations](#performance-optimizations)

## 🎯 Application Overview

Base.Tube is built as a single-page application (SPA) using React Router v6 for navigation. The app features a complex routing system that handles both public and protected routes, multiple authentication methods, and specialized layouts for different user roles.

### Key Architecture Features
- **Multi-Auth System**: Supports both traditional (Clerk) and Web3 authentication
- **Role-Based Layouts**: Different layouts for public, authenticated, and creator users
- **Lazy Loading**: Code splitting for performance optimization
- **Context Providers**: Centralized state management for various app features
- **Protected Routes**: Authentication guards and route protection

## 🗺️ Routing Structure

### Public Routes
Routes accessible without authentication:

```typescript
// Core public routes
<Route path="/" element={<HomePage />} />
<Route path="/discover" element={<DiscoveryPage />} />
<Route path="/search" element={<SearchPage />} />
<Route path="/video/:id" element={<SingleVideo />} />
<Route path="/nft-marketplace" element={<NFTMarketplace />} />
<Route path="/leaderboard" element={<Leaderboard />} />

// Content Pass Landing
<Route path="/content-passes" element={<LandingPage />} />

// Channel pages
<Route path="/channel/:identifier" element={<ChannelDetailPage />} />
<Route path="/channel" element={<ChannelPage />} />

// Pass-related public routes
<Route path="/p/:slug" element={<PassDetailsPage />} />
<Route path="/pay/success" element={<CheckoutSuccessPage />} />
<Route path="/watch/:passId" element={<WatchPassPage />} />

// Public embed (outside auth wrapper)
<Route path="/embed/:videoId" element={<EmbedVideo />} />

// FAQ and info pages
<Route path="/faq" element={<FAQPage />} />
<Route path="/faq/moment-nfts" element={<MomentNFTsPage />} />
```

### Authentication Routes
Routes for sign-in and registration:

```typescript
// Traditional authentication
<Route path="/sign-in/*" element={
  <SignedOut>
    <SignInPage />
  </SignedOut>
} />
<Route path="/sign-up/*" element={
  <SignedOut>
    <SignUpPage />
  </SignedOut>
} />

// Web3 authentication
<Route path="/sign-in-web3" element={<SignInWeb3 />} />

// Onboarding flows
<Route path="/onboarding" element={
  <ProtectedRoute>
    <OnboardingModal />
  </ProtectedRoute>
} />
<Route path="/onboarding/web3" element={
  <ProtectedRoute>
    <OnboardingWeb3 />
  </ProtectedRoute>
} />
```

### Protected Routes
Routes requiring authentication:

```typescript
// User profile and settings
<Route path="/profile" element={
  <ProtectedRoute>
    <UserProfileWallet />
  </ProtectedRoute>
} />
<Route path="/profile/settings" element={
  <ProtectedRoute>
    <ProfileSettings />
  </ProtectedRoute>
} />

// User content management
<Route path="/subscribed" element={
  <ProtectedRoute>
    <SubscribedChannelPage />
  </ProtectedRoute>
} />
<Route path="/my-passes" element={
  <ProtectedRoute>
    <MyPasses />
  </ProtectedRoute>
} />
<Route path="/create-channel" element={
  <ProtectedRoute>
    <CreateChannelPage />
  </ProtectedRoute>
} />

// Special features
<Route path="/mint/moment-nft" element={
  <ProtectedRoute>
    <MomentNFTMintPage />
  </ProtectedRoute>
} />
```

### Creator Hub Routes
Specialized routes for content creators with custom layout:

```typescript
// Main creator hub
<Route path="/creator-hub" element={
  <CreatorHubRoute element={<CreatorHubLandingPage />} />
} />

// Content management
<Route path="/creator-hub/upload" element={
  <CreatorHubRoute element={<VideoUpload />} />
} />
<Route path="/creator-hub/videos" element={
  <CreatorHubRoute element={<VideosManagement />} />
} />
<Route path="/creator-hub/content-studio" element={
  <CreatorHubRoute element={<ContentStudio />} />
} />

// Analytics and insights
<Route path="/creator-hub/analytics" element={
  <CreatorHubRoute element={<AnalyticsPage />} />
} />
<Route path="/creator-hub/analytics/growth" element={
  <CreatorHubRoute element={<GrowthTab channelId={''} />} />
} />

// Monetization features
<Route path="/creator-hub/create-content-pass" element={
  <CreatorHubRoute element={
    <Suspense fallback={<LoadingSpinner />}>
      <CreateContentPass />
    </Suspense>
  } />
} />
<Route path="/creator-hub/passes" element={
  <CreatorHubRoute element={<ManagePassesPage />} />
} />
<Route path="/creator-hub/passes/:id" element={
  <CreatorHubRoute element={<PassDetailView />} />
} />

// Channel management
<Route path="/creator-hub/channels" element={
  <CreatorHubRoute element={<ChannelList />} />
} />
<Route path="/creator-hub/channels/:channelId" element={
  <CreatorHubRoute element={<ChannelManagement />} />
} />
```

### System Monitoring Routes
Administrative routes for system health:

```typescript
<Route path="/monitoring" element={
  <ProtectedRoute>
    <MonitoringLayout>
      <SystemHealth />
    </MonitoringLayout>
  </ProtectedRoute>
} />
<Route path="/monitoring/queue" element={
  <ProtectedRoute>
    <MonitoringLayout>
      <SystemHealth refreshInterval={5000} />
    </MonitoringLayout>
  </ProtectedRoute>
} />
```

## 🏗️ Layout Components

### 1. Main Layout (Default)
Used for most public routes:

```typescript
// Basic layout with header only
<div className="min-h-screen bg-black">
  <Header className="sticky top-0 z-50" />
  {children}
</div>
```

### 2. Creator Hub Layout
Specialized layout for creator-focused features:

```typescript
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
```

### 3. Monitoring Layout
Simplified layout for system monitoring:

```typescript
const MonitoringLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#09090B]">
    <Header className="sticky top-0 z-50" />
    {children}
  </div>
);
```

## 🔗 Context Providers

### Provider Hierarchy
The app uses multiple context providers in a specific hierarchy:

```typescript
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <VideoProvider>
        <AuthProvider>
          {/* App content */}
        </AuthProvider>
      </VideoProvider>
    </ConfigProvider>
  </QueryClientProvider>
</ErrorBoundary>
```

### Individual Providers

#### 1. QueryClientProvider
Provides React Query functionality:

```typescript
const queryClient = useMemo(() => new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
}), []);
```

#### 2. ConfigProvider
Application configuration management:
- Environment variables
- Feature flags
- API endpoints

#### 3. VideoProvider
Video-specific state management:
- Current video state
- Player settings
- Progress tracking

#### 4. AuthProvider
Authentication state management:
- User authentication status
- Auth method (traditional vs Web3)
- Session management

#### 5. ChannelSelectionProvider
Creator-specific state (within Creator Hub):
- Selected channel context
- Channel switching logic

## 🛡️ Protected Routes

### 1. ProtectedRoute Component
Basic authentication protection:

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <RedirectToSignIn />;
  }
  
  return <>{children}</>;
};
```

### 2. CreatorHubRoute Component
Enhanced protection with analytics prefetching:

```typescript
const CreatorHubRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <ProtectedRoute>
    <CreatorHubLayout>
      <AnalyticsRoute element={element} />
    </CreatorHubLayout>
  </ProtectedRoute>
);

const AnalyticsRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { prefetchCreatorAnalytics } = useAnalyticsContext();
  
  useEffect(() => {
    prefetchCreatorAnalytics('7d');
  }, [prefetchCreatorAnalytics]);

  return element;
};
```

## 📁 Code Organization

### File Structure
```
src/
├── App.tsx                 # Main application component
├── components/
│   ├── common/            # Shared components
│   ├── pages/             # Page-specific components
│   └── layouts/           # Layout components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── api/                   # API layer
├── types/                 # TypeScript definitions
├── utils/                 # Utility functions
└── styles/                # Global styles
```

### Component Organization Patterns

#### 1. Page Components
Each major route has its own page component:
- `HomePage.tsx` - Landing page
- `SingleVideo.tsx` - Video player page
- `CreatorHubLandingPage.tsx` - Creator dashboard

#### 2. Feature-Based Organization
Related components grouped by feature:
- `CreatorHub/` - All creator-related components
- `Analytics/` - Analytics and reporting components
- `Authentication/` - Auth-related components

#### 3. Shared Components
Reusable components in `common/`:
- `Header.tsx` - Global navigation
- `ErrorBoundary.tsx` - Error handling
- `ProtectedRoute.tsx` - Route protection

## ⚡ Performance Optimizations

### 1. Code Splitting
Lazy loading for large components:

```typescript
const ThumbnailGalleryPage = lazy(() => import('./pages/thumbnail-gallery'));
const CreateContentPass = lazy(() => import('./components/pages/CreatorHub/CreateContentPass/index'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <CreateContentPass />
</Suspense>
```

### 2. React Query Configuration
Optimized caching strategy:

```typescript
{
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Avoid unnecessary refetches
      retry: 2,                     // Limited retry attempts
      staleTime: Infinity,          // Data stays fresh indefinitely
      gcTime: 10 * 60 * 1000,      // 10-minute garbage collection
    },
  },
}
```

### 3. Route-Level Optimizations
- **Prefetching**: Analytics data prefetched for creator routes
- **Conditional Rendering**: Routes enabled based on authentication state
- **Layout Reuse**: Shared layout components to minimize re-renders

### 4. Component Memoization
Strategic use of React.memo and useMemo:

```typescript
const queryClient = useMemo(() => new QueryClient(config), []);

// Layout components that don't change frequently
const CreatorHubLayout = React.memo(({ children }) => {
  // Layout implementation
});
```

## 🐛 Issues & Improvements

### Current Issues:
• **Route Organization**: Some related routes are scattered throughout the file
• **Layout Duplication**: Similar layout code repeated in multiple places
• **Context Overuse**: Too many context providers potentially impacting performance
• **Error Handling**: Inconsistent error boundaries across different route groups
• **Loading States**: No global loading state management between route transitions

### Potential Improvements:
• **Route Grouping**: Organize routes by feature rather than by protection level
• **Layout Abstraction**: Create a more flexible layout system with composition
• **Context Optimization**: Combine related contexts and optimize provider hierarchy
• **Error Boundary Strategy**: Implement consistent error boundaries for all route groups
• **Loading State Management**: Add global loading indicators for route transitions
• **Route Protection**: Implement role-based route protection beyond just authentication
• **Performance Monitoring**: Add route-level performance tracking
• **SEO Optimization**: Implement proper meta tags and Open Graph data for public routes 