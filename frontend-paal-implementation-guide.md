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

Next up to finish Sprint 1:
1. Wrap up **ProtectedContent** reusable component (leveraging `useTokenGate`).✅
2. Cypress E2E tests for complete purchase → watch flow (desktop + mobile breakpoints).
3. Responsive polish & mobile QA for new Creator screens.
4. Error-state components (403, network errors) and user-friendly retry actions.
5. Accessibility pass (aria labels on buttons/iframes, keyboard nav for grid).
6. Linting & TypeScript strict-mode sweep.
7. **YouTube Channel Verification** - Connect creator's YouTube account to verify video ownership and enforce unlisted-only videos.

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
      headers: { Authorization: `Bearer ${await getToken()}` }
    });
    if (!res.ok) { setStatus('unlinked'); return; }
    const json = await res.json();
    setStatus(json.verified ? 'linked' : 'unlinked');
  }, [getToken]);

  const startOAuth = useCallback(async () => {
    const res = await fetch('/api/integrations/youtube/auth', {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });
    const { url } = await res.json();
    window.open(url, '_blank');
  }, [getToken]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  return { status, startOAuth, refetch: fetchStatus };
}
```

#### 3 · Creator-side UI changes

| Location | Change |
|----------|--------|
| **CreateContentPass** wizard – Step "Video URLs" | If `status === 'unlinked'` show an **alert + "Connect YouTube" button** that calls `startOAuth()`. Disable *Next* until `status === 'linked'`. |
| **Creator Settings › Integrations** (new tab) | Display card with current channel title + disconnect button (calls `DELETE /api/integrations/youtube`). |

After the user completes Google consent, the backend redirects to

```
${FRONTEND_URL}/dashboard/creator?ytLinked=1
```

so in the dashboard page add:

```ts
// useEffect(() => { if (router.query.ytLinked) youTube.refetch() }, [...])
```

#### 4 · Pass Creation Guard (frontend-side)

The backend already validates, but for UX we block early:

```ts
if (isYouTube(url) && youtubeAuth.status !== 'linked') {
   showToast('Connect your YouTube channel before adding videos');
   return;
}
```

#### 5 · E2E Test (Cypress)

1. Programmatically sign-in via Clerk helper.  
2. Hit `/api/integrations/youtube/auth` → open new tab, complete consent with Google test account.  
3. Assert `/status` returns `verified=true`.  
4. Submit pass with an un-listed YT URL → expect **201**.  
5. Submit pass with *public* video → expect **400/403**.

---

Once these steps are merged the Sprint-1 "YouTube channel ownership verification" story is fulfilled end-to-end (backend + frontend).

## 3. Key Components to Implement

### 3.1 Pass Details Page (`/p/:slug`)

This page displays information about the pass and allows users to purchase it.

**Requirements:**
- Create a new route `/p/:slug` in your routing system
- Fetch pass details using `GET /api/v1/passes/:slug`
- Display:
  - Pass title
  - Description
  - Creator information
  - Price (formatted with currency)
  - Video thumbnail (if available)
- Show "Unlock" button for non-owners
- Check if the user already owns the pass (make authenticated request if user is logged in)
- Handle sold-out state if applicable

**Example API Response:**
```json
{
  "id": "abc123-uuid",
  "title": "Premium Tutorial",
  "description": "Learn advanced techniques",
  "price_cents": 500,
  "currency": "EUR",
  "formatted_price": "€5.00",
  "tier": "bronze",
  "channel": {
    "name": "Creator Channel",
    "user": {
      "username": "creator123"
    }
  },
  "videos": [
    {
      "id": "video-uuid",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "platform": "youtube"
    }
  ]
}
```

### 3.2 Authentication Integration

For authenticated actions, integrate with Clerk authentication:

**Requirements:**
- Add login/signup UI on the paywall page for unauthenticated users
- Implement "Continue with Email" and social login options
- Ensure Clerk auth token is sent with authenticated API requests
- Store auth state in context/state management

### 3.3 Checkout Flow

When a user clicks "Unlock", initiate the Stripe checkout process:

**Requirements:**
- Call `POST /api/v1/passes/:id/checkout` with authentication
- Receive `session_id` and `url` in the response
- Redirect to Stripe checkout page: `window.location.href = response.url`
- Configure success URL to return to `/pay/success?session_id={CHECKOUT_SESSION_ID}`
- Configure cancel URL to return to the original pass page

**Example API Request:**
```javascript
const response = await fetch(`/api/v1/passes/${passId}/checkout`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.tson();
if (data.url) {
  window.location.href = data.url;
}
```

### 3.4 Success Page (`/pay/success`)

After successful payment, Stripe redirects to this page:

**Requirements:**
- Create a new route `/pay/success` that accepts query param `session_id`
- Show loading state while verifying purchase
- Implement optional polling to confirm purchase row exists (for webhook delay cases)
- Display the video player once purchase is confirmed
- Add "Share" button to promote the pass
- Include proper error handling for edge cases

**Verification Flow:**
1. Extract `session_id` from query params
2. Attempt to fetch signed URL for the video
3. If 403, implement polling (retry a few times with delay)
4. If 200, display the video

### 3.5 Video Player Component

Create a video player component that can display content based on platform:

**Requirements:**
- Accept signed URL as input
- Support YouTube embeds initially (more platforms in future sprints)
- Implement responsive design (mobile-first)
- Add basic player controls
- Handle loading/error states

### 3.6 Token-Gating Implementation

Implement the token-gating mechanism on the frontend:

**Requirements:**
- Create a service that handles token verification
- Implement a hook that checks if user has access to content (`useHasAccess`)
- Develop a protected content wrapper component that:
  - Shows paywall UI for non-owners
  - Shows content for owners
  - Handles loading state during verification
- Create utility functions to retrieve signed URLs

**Implementation Example:**
```javascript
// useTokenGate.ts
export function useTokenGate(videoId) {
  const { user, isLoaded } = useAuth();
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !user || !videoId) {
      setIsLoading(false);
      return;
    }

    async function fetchSignedUrl() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/passes/videos/${videoId}/signed-url`, {
          headers: {
            'Authorization': `Bearer ${user.getToken()}`
          }
        });

        if (response.status === 403) {
          setError({ type: 'access_denied' });
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch signed URL');
        }

        const data = await response.tson();
        setSignedUrl(data.signed_url);
        setIsLoading(false);
      } catch (err) {
        setError({ type: 'error', message: err.message });
        setIsLoading(false);
      }
    }

    fetchSignedUrl();
  }, [videoId, user, isLoaded]);

  return { signedUrl, isLoading, error };
}
```

## 4. UI/UX Requirements

### 4.1 Mobile Responsiveness

- All components must work on mobile devices (70% of expected traffic)
- Test on various screen sizes (320px up to desktop)
- Touch-friendly UI elements (min 44px touch targets)

### 4.2 Design System

- Follow BaseTube design system for consistency
- Use existing color schemes, typography, and spacing
- Implement proper loading states and skeletons
- Add appropriate animations for transitions

### 4.3 Error Handling

Implement user-friendly error handling for:
- API errors
- Authentication failures
- Network issues
- Stripe checkout failures
- Video loading problems

## 5. Testing Requirements

### 5.1 User Flow Testing

Develop and test the following scenarios:
- User views pass details (unauthenticated)
- User logs in and purchases pass
- User returns to already purchased pass
- User cancels checkout
- Success page with valid/invalid session_id

### 5.2 Token-Gating Smoke Tests

The following scenarios must be thoroughly tested:
- After a test payment, user should be able to access content
- When a user doesn't own a pass, they should get a 403 when trying to get signed URL
- When a user owns a pass, they should receive a valid signed URL
- Check proper timeout/expiry of signed URLs
- Test access across multiple sessions and devices with the same account
- Verify that direct URL access is properly protected

### 5.3 Integration Testing

- Create Cypress tests for the complete purchase flow
- Test webhook handling with various Stripe events
- Test API integration points with mocked responses
- Verify proper state management during page refreshes
- Test error recovery paths (network interruptions, token expiry)

## 6. Implementation Notes

- Build reusable components where possible
- Use React Query for API data fetching and caching
- Implement proper loading states
- Consider feature flags for future functionality (crypto payments)
- Document any new components created

## 7. API Error Codes

Be prepared to handle these error responses:

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Pass is sold out or already owned | Show appropriate message |
| 401 | Unauthorized | Redirect to login |
| 403 | User doesn't own pass | Show purchase UI |
| 404 | Pass not found | Show error page |
| 500 | Server error | Show generic error with retry |

## 8. Implementation Timeline

For Sprint 1, focus on these components in order:
1. Pass details page
2. Authentication integration
3. Checkout flow
4. Success page
5. Video player
6. Token-gating implementation
7. Error handling
8. Testing

## 9. Future Considerations (FYI - Not for Sprint 1)

The following features will be implemented in future sprints:
- Crypto payment option
- Embedded/iframe support
- Creator analytics dashboard
- Resale marketplace
- Advanced player features

Always develop with these future features in mind to ensure extendability.

## 10. Dependencies

- Clerk.ts for authentication
- React Query for data fetching
- React Router for routing
- Video.ts or React Player for video playback 



# Pass-as-a-Link Implementation Plan

## Component Structure

```
src/
├─ pages/
│  ├─ PassDetailsPage.tsx        # /p/:slug
│  └─ CheckoutSuccessPage.tsx    # /pay/success
├─ components/pass/
│  ├─ PassCard.tsx               # visual card (optional)
│  ├─ PassInfo.tsx               # metadata section
│  └─ UnlockButton.tsx           # auth + checkout
├─ components/video/             # existing pattern
│  └─ VideoPlayer.tsx
├─ hooks/
│  ├─ usePass.ts                 # details + checkout + signedUrl
│  └─ useTokenGate.ts            # access verification (to build)
└─ api/
   └─ pass.ts                    # we've implemented
```

## Implementation Plan

1. **Setup & Routing**
   - Configure routes for pass details and success pages
   - Set up API integration layer

2. **Pass Details Page**
   - Implement pass data fetching
   - Create mobile-first UI for pass info
   - Add authentication check

3. **Checkout Flow**
   - Implement UnlockButton component
   - Add Stripe checkout integration
   - Handle auth states and redirects

4. **Success Page & Video Player**
   - Create success page with session verification
   - Implement video player with signed URL support
   - Add polling for delayed webhook processing

5. **Token-Gating**
   - Implement access verification
   - Create protected content wrapper
   - Handle various auth/access states

6. **Finalization**
   - Add comprehensive error handling
   - Implement responsive styling
   - Test all user flows

