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

🔄 `useTokenGate` and protected content wrapper not implemented yet.

Next up in Sprint 1:
1. ✅ ~~Implement `VideoPlayer` with signed URL handling.~~ (Done: PassVideoPlayer.tsx)
2. ✅ ~~Connect `CheckoutSuccessPage` to useCheckoutStatus for polling and PassVideoPlayer.~~ (Done)
3. Create `useTokenGate` hook and `ProtectedContent` wrapper.
4. Add Cypress tests for complete purchase flow.
5. Mobile QA & error handling polish.

**UPDATE: New API endpoints added (Sprint 1.1):**
- Fetch user's purchased passes: `GET /api/v1/passes/me` (requires auth)
- Check checkout status: `GET /api/v1/passes/purchase/status/:sessionId`

New React hooks available:
- `usePurchasedPasses()` - List all passes the current user has purchased
- `useCheckoutStatus(sessionId)` - Poll the backend for Stripe checkout session status

## 2. API Integration Points

The backend has already implemented these endpoints that your frontend needs to integrate with:

| Endpoint | Method | Purpose | Authentication Required |
|----------|--------|---------|-------------------------|
| `/api/v1/passes/:id` | GET | Fetch pass details by ID or slug | No |
| `/api/v1/passes/:id/checkout` | POST | Create Stripe checkout session | Yes |
| `/api/v1/passes/videos/:id/signed-url` | GET | Get signed URL if authorized | Yes |

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

Would you like me to start implementing any specific component first?
