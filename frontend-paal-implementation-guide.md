# Frontend Implementation Guide: Pass-as-a-Link
## Sprint 1 - Pay-wall Implementation

This document outlines the frontend implementation requirements for the Pass-as-a-Link feature during Sprint 1. It serves as a comprehensive guide for the frontend developer working on this feature.

## 1. Overview

In Sprint 1, we're implementing the core Pay-wall frontend components that will:
- Display pass details to potential buyers
- Provide a checkout flow via Stripe
- Handle success/failure scenarios
- Display the gated content after successful purchase

## 1.1 Sprint 1 Progress Update (auto-generated on implementation)

✅ Pass details page (`PassDetailsPage.tsx`) delivered with premium UI and `PremiumHeader`.

✅ Fallback thumbnail/blur image (`Content-pass.webp`) integrated.

✅ `UnlockButton` redesigned – now uses new `useRequireAuth` hook for friction-less Clerk/Web3Auth modal sign-in and continues directly to Stripe checkout.

✅ `useRequireAuth` hook implemented.

✅ `PassVideoPlayer` component created to support YouTube embeds and direct video formats.

✅ New endpoints and hooks: usePurchasedPasses and useCheckoutStatus for checkout polling implemented.

✅ `CheckoutSuccessPage` fully implemented with polling, status handling, and video player.

✅ `useTokenGate` hook implemented and integrated in **WatchPassPage**.

✅ **WatchPassPage** revamped:
   - Premium header added (fixed position)
   - Theater-style player with min-height (50-80 vh) and auto-aspect sizing
   - Video grid showing *all* videos in the pass; selecting a thumbnail swaps the main player
   - Robust YouTube ID parsing & playback fixes

✅ **Pass Discovery** implemented:
   - Added `usePassDiscover` hook with infinite scrolling support 
   - Created `PassCard` component with tier badge, price display, and ownership indicator
   - Integrated with DiscoveryPage under the "NFT Content Pass" tab
   - Conditional loading & error states with graceful empty view

✅ **Creator Pass Creation Flow** delivered:
   - Multi-step `CreateContentPass` wizard with validation
   - Automatic YouTube metadata fetch (title, duration, thumbnail)
   - Live iframe preview for each entered URL
   - Supports single or multi-video passes (maps to API `videos` array)

✅ **Creator Management Dashboard** delivered:
   - `ManagePassesPage` with overview cards and detailed view (`PassDetailView.tsx`)
   - `AddVideoToPass` flow hooked to `/passes/:id/videos`

✅ **My Passes / Library** page for buyers (search + filtering) implemented (`MyPasses.tsx`, `PassesTab.tsx`).

✅ Frontend YouTube service (`src/api/youtube.ts`) + backend proxy endpoint `/api/v1/youtube/metadata` integrated.

✅ ProtectedContent wrapper (simple HOC) – **pending** (but no longer blocking because WatchPassPage handles gating directly).

✅ **YouTube Channel Verification** implemented:
   - Created `useYouTubeAuth` hook with complete OAuth flow
   - Added YouTube integration component in Channel Management
   - Implemented unlinking functionality with confirmation flow
   - Secure verification checks before content pass creation
   - Enhanced channel creation flow with YouTube data import
   - Added user-friendly success flows and error handling
   - Developed reusable `NoChannelView` component for consistent empty states

Next up to finish Sprint 1:
1. Cypress E2E tests for complete purchase → watch flow (desktop + mobile breakpoints).
2. Responsive polish & mobile QA for new Creator screens.
3. Error-state components (403, network errors) and user-friendly retry actions.
4. Accessibility pass (aria labels on buttons/iframes, keyboard nav for grid).
5. Linting & TypeScript strict-mode sweep.

**UPDATE: YouTube Integration Enhancements (Sprint 1.2):**
- Added YouTube integration to new channel creation flow
- Implemented post-creation options screen with clear navigation paths
- Enhanced Creator Hub empty states with consistent, user-friendly UI
- Fixed header overlap issues across creator-related pages
- Improved validation and error handling in YouTube integration flow

---
## 1.2 Roadmap – Sprint 2 and beyond

After the core pay-wall is stable we move to engagement & creator tooling:

### Sprint 2 – Analytics & Creator Tools
1. **Referral tracking** – append `?ref=wallet` to checkout to credit promoters.
2. **Creator analytics MVP** – simple dashboard tile showing pass sales + watch minutes.
3. **Performance** – lazy-load player iframe & thumbnails, prune React re-renders.
4. **Search & filtering** – adding filters to Pass discovery (by tier, price range, creator).

### Sprint 3 – Marketplace / Resale (stretch)
1. Secondary-sale listing UI (list pass NFT for resale, browse marketplace).
2. On-chain royalty enforcement UI cues (disclaimer + creator cut %).
3. Wallet-based checkout as alt to Stripe (feature-flagged for early testers).
4. **Enhanced YouTube Integration**
   - Full OAuth flow with channel switching for multi-channel creators
   - Video status management (public → unlisted conversion with warnings)
   - Content stats integration with YouTube Analytics API

> Detailed tech specs for future sprints will be added in a dedicated section once Sprint 1 is complete.

**UPDATE: New API endpoints added (Sprint 1.1):**
- Fetch user's purchased passes: `GET /api/v1/passes/me` (requires auth)
- Check checkout status: `GET /api/v1/passes/purchase/status/:sessionId`
- Discover available passes: `GET /api/v1/passes/discover` (with filtering options)

**UPDATE: YouTube Channel Verification endpoints added:**
- Initiate YouTube OAuth: `GET /api/integrations/youtube/auth` (redirects to Google consent)
- OAuth callback handler: `GET /api/integrations/youtube/callback` (requires Clerk auth)
- Unlink YouTube channel: `DELETE /api/integrations/youtube` (requires Clerk auth)
- Check current channel link status: `GET /api/integrations/youtube/status` (requires Clerk auth)

New React hooks available:
- `usePurchasedPasses()` - List all passes the current user has purchased
- `useCheckoutStatus(sessionId)` - Poll the backend for Stripe checkout session status
- `usePassDiscover(params, options)` - Discover available passes with infinite scrolling
- `useYouTubeAuth()` - Manage YouTube channel linking/verification status

## 2. API Integration Points

The backend has already implemented these endpoints that your frontend needs to integrate with:

| Endpoint | Method | Purpose | Authentication Required |
|----------|--------|---------|-------------------------|
| `/api/v1/passes` | POST | Create a new pass | Yes |
| `/api/v1/passes/:id` | GET | Fetch pass details by ID or slug | No |
| `/api/v1/passes/:id/checkout` | POST | Create Stripe checkout session | Yes |
| `/api/v1/passes/videos/:id/signed-url` | GET | Get signed URL if authorized | Yes |
| `/api/v1/passes/discover` | GET | List available passes with filters | No |
| `/api/v1/passes/me` | GET | List all passes purchased by the user | Yes |
| `/api/v1/passes/creator/all` | GET | List all passes created by the user | Yes |
| `/api/v1/passes/purchase/status/:sessionId` | GET | Check status of Stripe checkout | No |
| `/api/v1/passes/:id/videos` | POST | Add additional video to an existing pass | Yes |

### Pass Creation Endpoint

The `/api/v1/passes` endpoint allows creators to monetize content by creating a new pass:

**Request Body Option 1 (Single Video):**
```json
{
  "title": "Premium Tutorial Series",         // required
  "description": "Advanced techniques for...", // optional
  "price_cents": 1500,                        // required, minimum 100 (= $1.00)
  "currency": "USD",                          // optional, defaults to EUR
  "tier": "silver",                           // optional, defaults to bronze
  "supply_cap": 100,                          // optional, max number of purchases
  "src_url": "https://youtu.be/VIDEO_ID"      // required if videos array not provided
}
```

**Request Body Option 2 (Multiple Videos):**
```json
{
  "title": "Complete Course Bundle",
  "description": "Full series with all modules",
  "price_cents": 4999,
  "currency": "USD",
  "tier": "gold",
  "supply_cap": 100,
  "videos": [                                 // Array of video URLs (required if src_url not provided)
    "https://youtu.be/VIDEO_ID_1",            // Can use string format
    { "src_url": "https://youtu.be/VIDEO_ID_2" }, // Or object format
    "https://youtu.be/VIDEO_ID_3"
  ]
}
```

> **Important**: For best results, only use unlisted YouTube videos. Monetizing public videos violates YouTube's Terms of Service. We currently support only YouTube for the MVP phase.

**Response (201 Created):**
```json
{
  "id": "uuid-of-new-pass",
  "title": "Premium Tutorial Series",
  "description": "Advanced techniques for...",
  "price_cents": 1500,
  "currency": "USD",
  "formatted_price": "$15.00",
  "tier": "silver",
  "supply_cap": 100,
  "minted_count": 0,
  "slug": "premium-tutorial-series",
  "checkout_url": "https://base.tube/p/premium-tutorial-series",
  "videos": [
    {
      "id": "video-uuid-1",
      "src_url": "https://youtu.be/VIDEO_ID_1",
      "platform": "youtube",
      "platform_video_id": "VIDEO_ID_1",
      "thumbnail_url": "https://img.youtube.com/vi/VIDEO_ID_1/maxresdefault.jpg"
    },
    {
      "id": "video-uuid-2",
      "src_url": "https://youtu.be/VIDEO_ID_2",
      "platform": "youtube",
      "platform_video_id": "VIDEO_ID_2",
      "thumbnail_url": "https://img.youtube.com/vi/VIDEO_ID_2/maxresdefault.jpg"
    }
    // All videos included in the response
  ]
}
```

**Error Responses:**
- 400: Missing required fields or price too low
- 401: Unauthorized (no valid auth token)
- 409: URL already used in another pass

**Notes:**
- If the creator doesn't have a channel, one will be automatically created
- A unique slug is generated from the title for the checkout URL
- Currently supports YouTube, Twitch, Instagram, TikTok, and other URLs
- Only unlisted videos should be monetized (public videos violate platform ToS)

### New Creator Dashboard Components to Implement

The frontend should include a Creator Dashboard section where creators can:

1. **Create Pass Form**
   - Display form with all required fields 
   - URL validation and preview thumbnail generation
   - Currency selector with appropriate formatting
   - Success confirmation with copy-to-clipboard for share link

2. **Pass Management**
   - List all creator's passes using `/api/v1/passes/creator/all`
   - Show sales metrics (minted vs supply cap)
   - Provide direct links to edit, view reports, or add videos

3. **Add Videos to Pass**
   - Form to add additional videos to existing passes
   - Use `/api/v1/passes/:id/videos` endpoint
   - Video preview and validation

**Implementation Example for Pass Creation:**
```javascript
async function createPass(passData) {
  try {
    const response = await fetch('/api/v1/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: passData.title,
        description: passData.description,
        price_cents: passData.priceInCents,
        currency: passData.currency,
        tier: passData.tier,
        supply_cap: passData.supplyLimit || null,
        // Either use src_url for a single video
        ...(passData.videoUrl ? { src_url: passData.videoUrl } : {}),
        // Or videos array for multiple videos
        ...(passData.videoUrls?.length ? { videos: passData.videoUrls } : {})
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create pass');
    }
    
    const newPass = await response.json();
    return newPass;
  } catch (error) {
    console.error('Error creating pass:', error);
    throw error;
  }
}
```

### 2.1 Discover Endpoint Parameters

The `/api/v1/passes/discover` endpoint allows listing and filtering all publicly available passes:

**Query Parameters:**
- `limit` (default: 20, max: 100) - Number of results to return
- `offset` (default: 0) - Pagination offset
- `search` - Text search in title and description
- `tier` - Filter by pass tier (`bronze`, `silver`, `gold`)
- `price_min` - Minimum price in cents
- `price_max` - Maximum price in cents
- `platform` - Filter by platform (`youtube`, `twitch`, `instagram`, `tiktok`, `other`)
- `channel_id` - Filter by specific channel
- `sold_out=false` - Exclude sold-out passes

**Response Example:**
```json
{
  "data": [
    {
      "id": "uuid-pass-1",
      "title": "Advanced Tutorial",
      "description": "Learn expert techniques",
      "price_cents": 1000,
      "currency": "USD",
      "formatted_price": "$10.00",
      "checkout_url": "https://base.tube/p/advanced-tutorial",
      "tier": "gold",
      "channel": { 
        "name": "Pro Channel",
        "user": { "username": "pro-creator" }
      },
      "videos": [
        {
          "id": "video-uuid-1",
          "thumbnail_url": "https://img.youtube.com/vi/abcdef/maxresdefault.jpg",
          "platform": "youtube"
        }
      ]
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

### YouTube Channel Verification Flow

Sprint-1 backend work is now complete: creators can link their YouTube channel via Google OAuth and the backend will reject pass creation if the video does not belong to the verified (and un-listed) channel.

Below is everything the **frontend** team must implement/configure so Sprint-1 truly "Done-Done."

#### 1 · Environment

Add the following entry in your **Vite/CRA env file** (not strictly required, but helpful for clarity when debugging):

```
VITE_GAPI_CLIENT_ID=964829531737-8h7op73i1hoi3gv0iisia9cl2vda50vm.apps.googleusercontent.com
```

> This is *only* used to display the client-id in logs/debug panels; all server calls hit our backend.

#### 2 · React Hook `useYouTubeAuth()` (update)

```ts
// src/hooks/useYouTubeAuth.ts (pseudo-code)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useYouTubeAuth() {
  const { getToken } = useAuth();

  const [status, setStatus] = useState<'unknown' | 'linked' | 'unlinked' | 'loading'>('unknown');

  const fetchStatus = useCallback(async () => {
    setStatus('loading');
    const res = await fetch('/api/integrations/youtube/status', {
      headers: { Authorization: `