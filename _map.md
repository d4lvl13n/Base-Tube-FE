# Repository Map - Base.Tube Frontend

This document provides a comprehensive tree-like representation of the repository structure, entry points, tech stack, and module relationships.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 (Create React App) |
| Language | TypeScript (~4.9.5) |
| Styling | Tailwind CSS + styled-components |
| State Management | TanStack Query (React Query) v5 |
| Routing | React Router DOM v6 |
| Authentication | Clerk (email) + Web3 (wagmi/viem/RainbowKit) |
| HTTP Client | Axios with interceptors |
| UI Components | MUI, Radix UI, Headless UI, Lucide icons |
| Video Player | video.js, react-player |
| Charts | Recharts, Chart.js |
| Forms | react-hook-form |
| Rich Text | TipTap |
| Blockchain | wagmi v2, viem, RainbowKit (Base chain) |
| Testing | Jest, React Testing Library, MSW |

---

## Primary Entry Points

```
src/
├── index.tsx          # React DOM root, Clerk/Wagmi providers wrap App
├── App.tsx            # Main router, context providers, all routes defined here
└── setupTests.ts      # Jest test configuration, polyfills, browser mocks
```

---

## Directory Structure

```
base-tube-mockup/
├── public/                    # Static assets, manifest.json
├── docs/                      # Documentation (PRD, API, architecture guides)
│   ├── content-pass-frontend-integration-guide.md  # Key integration doc
│   ├── TESTING_ROADMAP.md
│   ├── APP_ARCHITECTURE.md
│   └── ...
├── src/
│   ├── api/                   # API layer (axios-based)
│   │   ├── index.ts           # Axios instance with auth interceptors
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── web3authapi.ts     # Web3 wallet auth (nonce, verify, link)
│   │   ├── pass.ts            # Content Pass CRUD, checkout, access
│   │   ├── onchainPass.ts     # On-chain pass verification, claiming
│   │   ├── video.ts           # Video CRUD, upload, processing
│   │   ├── channel.ts         # Channel CRUD, subscriptions
│   │   ├── ctr.ts             # CTR Thumbnail Engine (audit, generate)
│   │   ├── thumbnail.ts       # Public thumbnail generation
│   │   ├── analytics.ts       # Creator analytics
│   │   ├── comment.ts         # Comments CRUD
│   │   ├── profile.ts         # User profile management
│   │   ├── leaderboard.ts     # Points leaderboard
│   │   ├── userPoints.ts      # User points system
│   │   ├── discovery.ts       # Discovery feed
│   │   ├── search.ts          # Search API
│   │   ├── monitoring.ts      # System health monitoring
│   │   ├── embed.ts           # Video embed support
│   │   ├── youtube.ts         # YouTube import
│   │   ├── youtubeAuth.ts     # YouTube OAuth
│   │   ├── contracts.ts       # Smart contract addresses
│   │   ├── batchupload.ts     # Batch video upload
│   │   ├── onboarding.ts      # User onboarding
│   │   └── shareApi.ts        # Social sharing
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWeb3Auth.ts     # Web3 wallet connection, signing
│   │   ├── useRequireAuth.ts  # Auth gating, modal trigger
│   │   ├── useCurrentUser.ts  # Current user data
│   │   ├── usePass.ts         # Pass details, checkout, purchase
│   │   ├── useOnchainPass.ts  # On-chain access, claiming
│   │   ├── usePlayToken.ts    # Secure video playback URLs with storage tier routing
│   │   ├── useCTREngine.ts    # CTR thumbnail audit/generation
│   │   ├── usePublicThumbnailGenerator.ts  # Public thumbnail tool
│   │   ├── useAnalyticsData.ts # Creator analytics
│   │   ├── useComments.ts     # Comments management
│   │   ├── useChannels.ts     # Channel list
│   │   ├── useChannelData.ts  # Single channel data
│   │   ├── useChannelSubscription.ts # Subscribe/unsubscribe
│   │   ├── useDiscoveryFeed.ts # Discovery feed
│   │   ├── useTrendingVideos.ts # Trending videos
│   │   ├── useVideoFetch.ts   # Video data fetching
│   │   ├── useVideoProcessing.ts # Upload processing status
│   │   ├── useVideoProgress.ts # Playback progress
│   │   ├── useViewTracking.ts # View count tracking
│   │   ├── useLikes.ts        # Like/dislike
│   │   ├── useSearch.ts       # Search functionality
│   │   ├── useLeaderboard.ts  # Leaderboard data
│   │   ├── useUserPoints.ts   # User points
│   │   ├── useWallet.ts       # Wallet state
│   │   ├── useLinkWallet.ts   # Wallet linking
│   │   ├── useProfileData.ts  # Profile management
│   │   ├── useWatchHistory.ts # Watch history
│   │   ├── useYouTubeAuth.ts  # YouTube OAuth
│   │   ├── useChannelAI.ts    # AI channel features
│   │   ├── useAIthumbnail.ts  # AI thumbnail generation
│   │   ├── useGeneratedName.ts # Random name generation
│   │   ├── useLocalStorage.ts # localStorage wrapper
│   │   ├── useWindowSize.ts   # Window dimensions
│   │   ├── usePreventScroll.ts # Scroll lock for modals
│   │   └── useErrorHandling.ts # Centralized error handling
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Web3 auth state (wraps useWeb3Auth)
│   │   ├── ConfigContext.tsx  # App config from API (cached 1hr)
│   │   ├── VideoContext.tsx   # Video player state (comments panel)
│   │   ├── ChannelSelectionContext.tsx # Creator hub channel selection
│   │   ├── DescriptionDockContext.tsx  # Video description dock
│   │   ├── PlaybackContext.tsx # Global playback state
│   │   └── NavigationContext.tsx # Navigation state
│   │
│   ├── context/               # Legacy context (consider consolidating)
│   │   └── ChannelContext.tsx # Channel context
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── video.ts           # Video, VideoStatus, pagination
│   │   ├── channel.ts         # Channel types
│   │   ├── auth.ts            # User, AuthenticationStep, LoginResponse
│   │   ├── pass.ts            # Pass, PlayTokenData, PlayTokenErrorCode, storage_tier types
│   │   ├── onchainPass.ts     # OnchainAccess, ClaimRequest/Response
│   │   ├── ctr.ts             # CTR audit, generation, quota types
│   │   ├── thumbnail.ts       # Thumbnail generation types
│   │   ├── analytics.ts       # Analytics data types
│   │   ├── comment.ts         # Comment types
│   │   ├── user.ts            # User profile types
│   │   ├── error.ts           # Error codes and types
│   │   ├── config.ts          # View config types
│   │   ├── discovery.ts       # Discovery feed types
│   │   ├── contracts.ts       # Smart contract types
│   │   ├── history.ts         # Watch history types
│   │   ├── like.ts            # Like types
│   │   ├── share.ts           # Share types
│   │   ├── userPoints.ts      # Points system types
│   │   ├── view.ts            # View tracking types
│   │   ├── nft.ts             # NFT types
│   │   └── globals.d.ts       # Global type declarations
│   │
│   ├── components/
│   │   ├── ui/                # Base UI components (buttons, inputs)
│   │   ├── pass/              # Pass-related components
│   │   ├── animations/        # Animation components (Framer Motion)
│   │   ├── ThumbnailGallery/  # Thumbnail gallery components
│   │   │
│   │   ├── common/            # Shared components
│   │   │   ├── Header.tsx     # Main header/navbar
│   │   │   ├── Modal.tsx      # Base modal component
│   │   │   ├── Loader.tsx     # Loading spinner
│   │   │   ├── Error.tsx      # Error display
│   │   │   ├── EmptyState.tsx # Empty state placeholder
│   │   │   ├── ErrorBoundary.tsx # React error boundary
│   │   │   ├── CategoryNav.tsx # Category navigation
│   │   │   ├── AIThumbnailPanel.tsx # AI thumbnail UI
│   │   │   ├── AIAssistantPanel.tsx # AI assistant UI
│   │   │   ├── Video/         # Video player components
│   │   │   │   ├── Comments/  # Comment system
│   │   │   │   ├── DescriptionDock/ # Video description
│   │   │   │   ├── MiniPlayer/ # Picture-in-picture player
│   │   │   │   └── RadialMenu/ # Video action menu
│   │   │   ├── Channel/       # Channel display components
│   │   │   ├── Profile/       # Profile components
│   │   │   ├── CreatorHub/    # Shared creator hub components
│   │   │   ├── Home/          # Home page components
│   │   │   ├── Notifications/ # Notification components
│   │   │   ├── SharePopup/    # Social share popup
│   │   │   ├── Toast/         # Toast notifications
│   │   │   ├── WalletWrapper/ # Wallet connection wrapper
│   │   │   ├── buttons/       # Button components
│   │   │   ├── RichTextEditor/ # TipTap editor
│   │   │   ├── DeleteConfirmationDialog/
│   │   │   ├── EmbedPreview/  # Video embed preview
│   │   │   └── ModalScreen/   # Full-screen modal
│   │   │
│   │   └── pages/             # Page components (route targets)
│   │       ├── HomePage.tsx   # / route
│   │       ├── SingleVideo.tsx # /video/:id
│   │       ├── ChannelDetailPage.tsx # /channel/:identifier
│   │       ├── ChannelPage/   # /channel
│   │       ├── CreateChannelPage.tsx # /create-channel
│   │       ├── DiscoveryPage/ # /discover
│   │       ├── SearchPage/    # /search
│   │       ├── UserProfileWallet.tsx # /profile
│   │       ├── ProfileSettings.tsx # /profile/settings
│   │       ├── SignInPage.tsx # /sign-in
│   │       ├── SignUpPage.tsx # /sign-up
│   │       ├── SignInWeb3/    # /sign-in-web3
│   │       ├── OnboardingModal.tsx # /onboarding
│   │       ├── OnboardingWeb3.tsx # /onboarding/web3
│   │       ├── ProtectedRoute.tsx # Auth wrapper component
│   │       ├── EmbedVideo.tsx # /embed/:videoId
│   │       ├── NFTMarketplace.tsx # /nft-marketplace
│   │       ├── MyPasses.tsx   # /my-passes
│   │       ├── SubscribedChannelPage/ # /subscribed
│   │       ├── Leaderboard/   # /leaderboard
│   │       │
│   │       ├── CTREngine/     # AI Thumbnails (/ai-thumbnails/*)
│   │       │   ├── index.tsx  # Route exports
│   │       │   ├── AIThumbnailsLayout.tsx # Shared layout
│   │       │   ├── AuditPage.tsx # /ai-thumbnails/audit
│   │       │   ├── GeneratePage.tsx # /ai-thumbnails/generate
│   │       │   ├── GalleryPage.tsx # /ai-thumbnails/gallery
│   │       │   ├── SettingsPage.tsx # /ai-thumbnails/settings
│   │       │   ├── AuditHistoryPage.tsx # /ai-thumbnails/history
│   │       │   ├── components/ # CTR-specific components
│   │       │   └── styles/    # CTR-specific styles
│   │       │
│   │       ├── ThumbnailLanding/ # /ai-thumbnails landing
│   │       │
│   │       ├── landingPage/   # /content-passes landing
│   │       │
│   │       ├── CreatorHub/    # Creator dashboard (/creator-hub/*)
│   │       │   ├── CreatorHubLandingPage.tsx # /creator-hub
│   │       │   ├── CreatorHubNav.tsx # Sidebar navigation
│   │       │   ├── VideoUpload.tsx # /creator-hub/upload
│   │       │   ├── Analytics/ # /creator-hub/analytics
│   │       │   │   ├── AnalyticsPage.tsx
│   │       │   │   ├── charts/
│   │       │   │   ├── tables/
│   │       │   │   └── tabs/
│   │       │   ├── VideosManagement/ # /creator-hub/videos
│   │       │   │   ├── index.tsx
│   │       │   │   ├── EditVideoModal/
│   │       │   │   └── components/
│   │       │   ├── ChannelManagement/ # /creator-hub/channels/:id
│   │       │   ├── ContentStudio/ # /creator-hub/content-studio
│   │       │   ├── CreateContentPass/ # /creator-hub/create-content-pass
│   │       │   │   ├── index.tsx
│   │       │   │   └── steps/  # Multi-step form
│   │       │   ├── ManagePasses/ # /creator-hub/passes
│   │       │   ├── MonetizationInfo.tsx # /creator-hub/monetization
│   │       │   └── YouTubeAuthCallback.tsx # /dashboard/creator
│   │       │
│   │       └── NftContentPass/ # NFT Content Pass simulator
│   │           └── NFTCPsimulator/
│   │
│   ├── pages/                 # Additional page components
│   │   ├── FAQ/               # /faq routes
│   │   ├── MomentNFTMint/     # /mint/moment-nft
│   │   ├── thumbnail-gallery/ # /thumbnail-gallery
│   │   ├── PassDetailsPage.tsx # /p/:slug (pass details)
│   │   ├── CheckoutSuccessPage.tsx # /pay/success
│   │   └── WatchPassPage.tsx  # /watch/:passId
│   │
│   ├── layouts/               # Layout components
│   │
│   ├── config/                # Configuration files
│   │
│   ├── constants/             # App constants
│   │
│   ├── utils/                 # Utility functions
│   │   └── errorHandler.ts    # Centralized error handling
│   │
│   ├── lib/                   # External library wrappers
│   │
│   ├── styles/                # Global styles
│   │   ├── theme.ts           # Theme configuration
│   │   └── prosemirror.css    # TipTap editor styles
│   │
│   ├── health/                # System health monitoring
│   │   ├── SystemHealth.tsx   # /monitoring route
│   │   └── components/
│   │
│   ├── mocks/                 # MSW mock handlers
│   │   ├── server.ts          # MSW server setup
│   │   └── handlers/          # API mock handlers
│   │       ├── index.ts
│   │       ├── auth.handlers.ts
│   │       └── ctr.handlers.ts
│   │
│   └── tests/                 # Test files
│       ├── auth/              # Auth tests
│       └── api/               # API tests
│
├── CLAUDE.md                  # AI assistant guidance
├── _map.md                    # This file
├── package.json               # Dependencies, scripts
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind CSS config
└── .env*                      # Environment variables
```

---

## Module Relationships

### Authentication Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     DUAL AUTHENTICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                       │
│  │   Clerk      │         │   Web3       │                       │
│  │   (Email)    │         │   (Wallet)   │                       │
│  └──────┬───────┘         └──────┬───────┘                       │
│         │                        │                               │
│         ▼                        ▼                               │
│  ┌──────────────────────────────────────────┐                    │
│  │        src/api/index.ts                   │                    │
│  │        (Axios interceptor)                │                    │
│  │        - Injects Clerk JWT or            │                    │
│  │        - Uses Web3 cookies               │                    │
│  └──────────────────────────────────────────┘                    │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────┐                    │
│  │           Backend API                     │                    │
│  │           (REACT_APP_API_URL)            │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  Auth method stored: localStorage.getItem('auth_method')         │
│  Values: 'clerk' | 'web3'                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Content Pass System
```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT PASS SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FIAT PURCHASE (Stripe)              CRYPTO PURCHASE (On-chain)  │
│  ─────────────────────               ──────────────────────────  │
│                                                                  │
│  1. User clicks "Buy"                1. User connects wallet     │
│  2. POST /passes/:id/checkout        2. Get crypto quote         │
│  3. Redirect to Stripe               3. Sign transaction         │
│  4. Return to /pay/success           4. Pass minted to wallet    │
│  5. Purchase status: 'pending'                                   │
│  6. User has IMMEDIATE access                                    │
│  7. [Later] Connect wallet                                       │
│  8. Go to Profile → Passes tab                                   │
│  9. Click "Claim All to Wallet"                                  │
│  10. POST /purchases/mint-pending                                │
│  11. Pass minted to wallet as NFT                                │
│                                                                  │
│  Types: src/types/pass.ts, src/types/onchainPass.ts              │
│  APIs: src/api/pass.ts, src/api/onchainPass.ts                   │
│  Hooks: src/hooks/usePass.ts, src/hooks/useOnchainPass.ts        │
│  Pages: src/pages/PassDetailsPage.tsx, CheckoutSuccessPage.tsx   │
│  Components: src/components/common/Profile/PendingPassesClaim.tsx│
└─────────────────────────────────────────────────────────────────┘
```

### Secure Video Playback System
```
┌─────────────────────────────────────────────────────────────────┐
│                 SECURE VIDEO URL SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Video URLs are NOT exposed in API responses.                    │
│  Instead, playback URLs are fetched on-demand based on           │
│  storage_tier:                                                   │
│                                                                  │
│  ┌────────────────────┐    ┌────────────────────┐                │
│  │  storage_tier:     │    │  storage_tier:     │                │
│  │  'external'        │    │  'standard' |      │                │
│  │  (YouTube, etc.)   │    │  'premium' | 'cdn' │                │
│  └─────────┬──────────┘    └─────────┬──────────┘                │
│            │                         │                           │
│            ▼                         ▼                           │
│  POST /videos/:id/play-token   GET /videos/:id/signed-url        │
│            │                         │                           │
│            ▼                         ▼                           │
│  Returns: embed_url,           Returns: signed S3/CDN URL        │
│           playback_url                                           │
│                                                                  │
│  Error Handling:                                                 │
│  - USE_PLAY_TOKEN: signed-url called for external → fallback     │
│  - NO_ACCESS: User doesn't own pass → show purchase prompt       │
│  - RATE_LIMIT: Too many requests → show wait message             │
│                                                                  │
│  Hook: src/hooks/usePlayToken.ts                                 │
│  API: src/api/pass.ts (getVideoPlaybackUrl, getPlayToken)        │
│  Types: PlayTokenData, PlayTokenErrorCode, StorageTier           │
│  Page: src/pages/WatchPassPage.tsx                               │
└─────────────────────────────────────────────────────────────────┘
```

### Pending Purchases Claim Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     PENDING PASSES CLAIM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Entry Points:                                                   │
│  1. Profile → Passes Tab (PendingPassesClaim component)          │
│  2. CheckoutSuccessPage (wallet connect prompt)                  │
│                                                                  │
│  API Endpoints:                                                  │
│  - GET /api/v1/purchases/pending → usePendingPurchases()         │
│  - POST /api/v1/purchases/mint-pending → useMintPending()        │
│                                                                  │
│  User Flow:                                                      │
│  1. User completes Stripe purchase                               │
│  2. Lands on /pay/success with wallet prompt                     │
│  3. Goes to /profile → Passes tab                                │
│  4. Sees pending passes banner with claim button                 │
│  5. Connects wallet (if not already)                             │
│  6. Clicks "Claim All to Wallet"                                 │
│  7. Backend mints NFT(s) to wallet                               │
│  8. Success modal shows results                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Wallet Linking for Clerk Users
```
┌─────────────────────────────────────────────────────────────────┐
│                  WALLET LINKING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Problem: When a Clerk user connects a wallet, we want to LINK   │
│  it to their account, not create a new Web3 account.             │
│                                                                  │
│  Solution: Intent-based wallet connection                        │
│                                                                  │
│  1. Before opening wallet modal, set intent:                     │
│     sessionStorage.setItem('wallet_connect_intent', 'link')      │
│                                                                  │
│  2. useWeb3Auth auto-connect checks for:                         │
│     - auth_method === 'clerk'                                    │
│     - Clerk session tokens in localStorage                       │
│     - wallet_connect_intent === 'link' or 'transaction'          │
│     → If any, skip auto-connect to prevent Web3 signup           │
│                                                                  │
│  3. useLinkWallet handles the actual linking:                    │
│     - POST /auth/web3/link-wallet                                │
│     - "Already linked to your account" → treat as success        │
│     - "Already linked" (different account) → show error          │
│                                                                  │
│  Entry Points:                                                   │
│  - CheckoutSuccessPage.tsx (claim NFT prompt)                    │
│  - PendingPassesClaim.tsx (profile passes tab)                   │
│                                                                  │
│  Files:                                                          │
│  - src/hooks/useWeb3Auth.ts (auto-connect guard)                 │
│  - src/hooks/useLinkWallet.ts (linking API + modal state)        │
│  - src/api/web3authapi.ts (linkWallet endpoint)                  │
└─────────────────────────────────────────────────────────────────┘
```

### CTR Thumbnail Engine
```
┌─────────────────────────────────────────────────────────────────┐
│                     CTR THUMBNAIL ENGINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Routes: /ai-thumbnails/*                                        │
│                                                                  │
│  ┌──────────────────────────────────────────┐                    │
│  │  useCTREngine (src/hooks/useCTREngine.ts)│                    │
│  │  - Quota management                       │                    │
│  │  - Audit (URL, file, YouTube)            │                    │
│  │  - Generate thumbnails                    │                    │
│  │  - Face reference upload                  │                    │
│  │  - Audit history                          │                    │
│  └──────────────────────────────────────────┘                    │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────┐                    │
│  │  ctrApi (src/api/ctr.ts)                 │                    │
│  │  - GET /ctr/quota                        │                    │
│  │  - POST /ctr/audit                       │                    │
│  │  - POST /ctr/audit/youtube               │                    │
│  │  - POST /ctr/generate                    │                    │
│  │  - GET/POST/DELETE /ctr/face-reference   │                    │
│  │  - GET /ctr/niches                       │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  Components: src/components/pages/CTREngine/                     │
│  Types: src/types/ctr.ts                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Context Provider Hierarchy
```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTEXT HIERARCHY (App.tsx)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ErrorBoundary                                                   │
│    └── QueryClientProvider (TanStack Query)                      │
│          └── ConfigProvider (API config, 1hr cache)              │
│                └── VideoProvider (comments panel state)          │
│                      └── AuthProvider (Web3 auth state)          │
│                            └── Routes                            │
│                                  └── ChannelSelectionProvider    │
│                                        (in CreatorHubLayout)     │
│                                                                  │
│  Note: Clerk provider wraps at index.tsx level                   │
│  Note: Wagmi/RainbowKit providers also at index.tsx level        │
└─────────────────────────────────────────────────────────────────┘
```

### API → Hook → Component Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW PATTERN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐                                              │
│  │  src/types/    │ ──── Type definitions                        │
│  └────────┬───────┘                                              │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                              │
│  │  src/api/      │ ──── Axios calls, error handling             │
│  └────────┬───────┘                                              │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                              │
│  │  src/hooks/    │ ──── TanStack Query wrappers, mutations      │
│  └────────┬───────┘                                              │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                              │
│  │  Components    │ ──── UI rendering, user interactions         │
│  └────────────────┘                                              │
│                                                                  │
│  Example: Pass System                                            │
│  types/pass.ts → api/pass.ts → hooks/usePass.ts → MyPasses.tsx   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Routes Summary

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | HomePage | No |
| `/discover` | DiscoveryPage | No |
| `/video/:id` | SingleVideo | No |
| `/channel/:identifier` | ChannelDetailPage | No |
| `/search` | SearchPage | No |
| `/sign-in` | SignInPage | No |
| `/sign-up` | SignUpPage | No |
| `/sign-in-web3` | SignInWeb3 | No |
| `/ai-thumbnails` | ThumbnailLanding | No |
| `/ai-thumbnails/audit` | CTRAuditPage | No |
| `/ai-thumbnails/generate` | CTRGeneratePage | **Yes** (for generation) |
| `/ai-thumbnails/gallery` | CTRGalleryPage | No |
| `/content-passes` | LandingPage | No |
| `/p/:slug` | PassDetailsPage | No |
| `/profile` | UserProfileWallet | **Yes** |
| `/my-passes` | MyPasses | **Yes** |
| `/creator-hub/*` | CreatorHubLayout | **Yes** |
| `/pay/success` | CheckoutSuccessPage | No |
| `/watch/:passId` | WatchPassPage | **Yes** |
| `/monitoring` | SystemHealth | **Yes** |
| `/embed/:videoId` | EmbedVideo | No |

---

## Testing

```bash
# Run all tests
npm test -- --watchAll=false

# Run tests matching pattern
npm test -- --testPathPattern="auth"

# Run single test file
npm test -- src/hooks/__tests__/useRequireAuth.test.ts
```

**Test Setup:** `src/setupTests.ts`
- Polyfills for TextEncoder/TextDecoder (wagmi/viem/msw compatibility)
- Browser API mocks (localStorage, matchMedia, ResizeObserver, IntersectionObserver)
- MSW server lifecycle (optional, has Node 18+ compatibility issues)

**Mock Handlers:** `src/mocks/handlers/`
- `auth.handlers.ts` - Authentication mocks
- `ctr.handlers.ts` - CTR engine mocks

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_URL` | Backend API base URL |
| `REACT_APP_CLERK_*` | Clerk authentication keys |
| `REACT_APP_WALLETCONNECT_*` | WalletConnect configuration |
| `REACT_APP_CHAIN_ID` | Target blockchain (8453 for Base mainnet) |

---

*Last updated: January 2025*
