# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm start                    # Start dev server (Create React App)

# Build
npm run build               # Production build (sourcemaps disabled)

# Testing
npm test                    # Run Jest tests in watch mode
npm test -- --watchAll=false # Run all tests once
npm test -- --testPathPattern="auth" # Run tests matching pattern
npm test -- path/to/file.test.ts     # Run single test file
```

## Architecture Overview

### Tech Stack
- **React 18** with TypeScript (Create React App)
- **Tailwind CSS** + styled-components for styling
- **TanStack Query** (React Query) for server state management
- **Clerk** + **Web3 (wagmi/viem/RainbowKit)** for dual authentication
- **Axios** for API requests with auth interceptors

### Authentication System (Dual-Auth Pattern)
The app supports two authentication methods that can work independently:

1. **Clerk Authentication** - Email/password sign-in
2. **Web3 Authentication** - Wallet-based sign-in (wagmi + RainbowKit on Base chain)

Auth method is stored in `localStorage.getItem('auth_method')` as `'clerk'` or `'web3'`.

**Wallet Linking for Clerk Users:** When a Clerk-authenticated user connects a wallet, the app links it to their existing account instead of creating a new Web3 account. This is controlled by:
- `sessionStorage.getItem('wallet_connect_intent')` - Set to `'link'` before opening wallet modal
- `useWeb3Auth.ts` auto-connect guard checks for Clerk session and intent
- `useLinkWallet.ts` handles the actual linking API call

Key files:
- `src/contexts/AuthContext.tsx` - Web3 auth context (wraps useWeb3Auth hook)
- `src/hooks/useWeb3Auth.ts` - Web3 wallet connection, signature verification, auto-connect guard
- `src/hooks/useLinkWallet.ts` - Wallet linking for Clerk users
- `src/hooks/useRequireAuth.ts` - Auth gating for protected routes
- `src/api/index.ts` - Axios interceptor that injects Clerk token or uses Web3 cookies

### API Layer
- Base URL configured via `REACT_APP_API_URL` env variable
- All API modules in `src/api/` use the shared axios instance from `src/api/index.ts`
- Auth tokens are automatically injected via axios interceptors
- 2-minute timeout for long operations (image generation)

### Context Providers (wrap order in App.tsx)
```
QueryClientProvider
  └── ConfigProvider (view config from API, 1hr cache)
      └── VideoProvider (comments panel state)
          └── AuthProvider (Web3 auth state)
              └── ChannelSelectionProvider (creator hub channel selection)
```

### Key Features

**CTR Thumbnail Engine** (`/ai-thumbnails/*`)
- AI-powered thumbnail audit and generation
- Quota-based system (audit/generate limits)
- Face reference uploads for consistency
- Hook: `src/hooks/useCTREngine.ts`
- API: `src/api/ctr.ts`

**Creator Hub** (`/creator-hub/*`)
- Protected routes with `CreatorHubLayout`
- Video upload, channel management, analytics
- Uses `ChannelSelectionProvider` for multi-channel creators

**Content Pass/NFT System** (`/content-passes`, `/p/:slug`, `/watch/:passId`)
- Token-gated content access with secure video URL system
- On-chain pass verification
- Hooks: `usePass.ts`, `useOnchainPass.ts`, `usePlayToken.ts`
- Video playback routes based on `storage_tier`:
  - `external` (YouTube, etc.) → play-token endpoint
  - `standard`/`premium`/`cdn`/`decentralised` → signed-url endpoint

### Routing Structure
- Public routes: Home, Discover, Video player, Search
- Protected routes: Profile, Subscriptions, Creator Hub (all sub-routes)
- Special layouts: `CreatorHubLayout` (sidebar nav), `MonitoringLayout`

### Testing Setup
- Jest with React Testing Library
- MSW handlers prepared in `src/mocks/` (Node 18+ compatibility issues noted)
- Browser API mocks in `src/setupTests.ts` (localStorage, matchMedia, ResizeObserver, IntersectionObserver)
- Jest config handles wagmi/viem ES module transforms

### Type Definitions
All types in `src/types/`:
- `video.ts` - Video, VideoStatus, pagination types
- `channel.ts` - Channel types
- `auth.ts` - User, AuthenticationStep, LoginResponse
- `ctr.ts` - CTR engine types (audit, generation, quota)
- `pass.ts`, `onchainPass.ts` - NFT/pass types

### Styling
- Tailwind with custom `base-orange` color (#fa7517)
- Custom shimmer animation for loading states
- Dark theme (bg-[#09090B] for Creator Hub)

## Environment Variables
Required in `.env`:
- `REACT_APP_API_URL` - Backend API base URL
- Clerk keys (see Clerk docs)
- Web3/wallet configuration
