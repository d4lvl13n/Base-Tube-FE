# Testing Roadmap

> A prioritized guide for implementing comprehensive test coverage across Base.Tube's authentication, API, and hooks layers.

---

## Overview

### Testing Stack

| Tool | Purpose | Status |
|------|---------|--------|
| **Jest** | Unit & Integration tests (CRA default) | ✅ Configured |
| **MSW** | API mocking (handlers ready) | ⚠️ Node 18+ compatibility issues |
| **React Testing Library** | Component behavior testing | ✅ Available |
| **Playwright** | End-to-end browser tests | 📋 Planned |

> **Note**: MSW v2 has compatibility issues with Jest in Node 18+ (TransformStream polyfill).
> For now, unit tests use `jest.mock()`. MSW handlers are ready for browser/Playwright tests.

### Priority Levels

- 🔴 **P0 - Critical**: Security & auth - must have before production
- 🟠 **P1 - High**: Core business logic - should have
- 🟡 **P2 - Medium**: Important features - nice to have
- ⚪ **P3 - Low**: Edge cases & polish - when time permits

---

## Phase 1: Authentication Layer (P0 - Critical)

The authentication system uses a **dual-auth pattern** (Clerk + Web3). This is the most critical area to test as it gates all protected functionality.

### 1.1 Core Auth Modules

| File | Tests Required | Priority |
|------|----------------|----------|
| `src/contexts/AuthContext.tsx` | State management, login/logout, session persistence | 🔴 P0 |
| `src/hooks/useWeb3Auth.ts` | Wallet connection, signature verification, disconnect | 🔴 P0 |
| `src/hooks/useRequireAuth.ts` | Auth modal trigger, redirect logic | 🔴 P0 |
| `src/api/index.ts` | Axios interceptor token injection | 🔴 P0 |
| `src/api/auth.ts` | Token refresh, session validation | 🔴 P0 |
| `src/api/web3authapi.ts` | Nonce request, signature verification, wallet linking | 🔴 P0 |

### 1.2 Test Cases - Auth Context

```
AuthContext
├── Initial State
│   ├── should start with isAuthenticated = false
│   ├── should start with user = null
│   └── should check localStorage for existing session
│
├── Login Flow
│   ├── should update isAuthenticated on successful login
│   ├── should store user data correctly
│   ├── should persist session to localStorage
│   └── should handle login errors gracefully
│
├── Logout Flow
│   ├── should clear isAuthenticated
│   ├── should clear user data
│   ├── should remove session from localStorage
│   └── should clear any cached tokens
│
└── Session Persistence
    ├── should restore session from localStorage on mount
    ├── should validate token expiry
    └── should handle expired sessions
```

### 1.3 Test Cases - Dual Auth Pattern

```
Dual Auth Detection
├── Clerk Only
│   ├── should return true when Clerk isSignedIn = true
│   └── should return false when Clerk isSignedIn = false
│
├── Web3 Only
│   ├── should return true when Web3 isAuthenticated = true
│   └── should return false when Web3 isAuthenticated = false
│
├── Combined
│   ├── should return true when either auth is true
│   ├── should return false when both are false
│   └── should not require both to be true
│
└── Token Selection
    ├── should use Clerk token when Clerk is signed in
    ├── should use Web3 token when only Web3 is authenticated
    └── should prefer Clerk token when both are available
```

### 1.4 Test Cases - Axios Interceptor

```
Token Injection (src/api/index.ts)
├── Request Interceptor
│   ├── should add Authorization header when authenticated
│   ├── should not add header when not authenticated
│   ├── should use correct token format (Bearer)
│   └── should handle async token retrieval
│
├── Response Interceptor
│   ├── should pass through successful responses
│   ├── should handle 401 errors (trigger re-auth)
│   ├── should handle 403 errors (access denied)
│   └── should handle network errors
│
└── Edge Cases
    ├── should handle token refresh during request
    ├── should queue requests during token refresh
    └── should retry failed requests after refresh
```

---

## Phase 2: API Layer (P0-P1)

### 2.1 User & Profile APIs

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/profile.ts` | `GET/PATCH /users/me`, profile updates | 🔴 P0 |

**Test Cases:**
```
Profile API
├── getProfile
│   ├── should return user profile when authenticated
│   ├── should return 401 when not authenticated
│   └── should handle network errors
│
├── updateProfile
│   ├── should update profile fields
│   ├── should validate required fields
│   └── should handle validation errors
│
└── deleteAccount
    ├── should require confirmation
    └── should clear all user data
```

### 2.2 Video APIs

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/video.ts` | CRUD, upload, processing status | 🟠 P1 |

**Test Cases:**
```
Video API
├── getVideo
│   ├── should return video by ID
│   ├── should return 404 for non-existent video
│   └── should handle private videos (auth required)
│
├── createVideo
│   ├── should create video with valid data
│   ├── should require authentication
│   └── should validate required fields
│
├── updateVideo
│   ├── should update video metadata
│   ├── should only allow owner to update
│   └── should handle partial updates
│
├── deleteVideo
│   ├── should delete video
│   ├── should only allow owner to delete
│   └── should cascade delete related data
│
└── uploadVideo
    ├── should handle file upload
    ├── should track upload progress
    ├── should handle upload cancellation
    └── should validate file type/size
```

### 2.3 Channel APIs

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/channel.ts` | CRUD, subscription, analytics | 🟠 P1 |

**Test Cases:**
```
Channel API
├── getChannel
│   ├── should return channel by ID or handle
│   ├── should include subscriber count
│   └── should include video list
│
├── createChannel
│   ├── should create channel for authenticated user
│   ├── should validate unique handle
│   └── should set default values
│
├── subscribe/unsubscribe
│   ├── should toggle subscription state
│   ├── should require authentication
│   └── should update subscriber count
│
└── getSubscriptions
    ├── should return user's subscribed channels
    ├── should support pagination
    └── should require authentication
```

### 2.4 CTR Engine APIs

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/ctr.ts` | Audit, generate, face-reference, quota | 🟠 P1 |

**Test Cases:**
```
CTR API
├── auditThumbnail
│   ├── should return CTR score and metrics
│   ├── should handle image URL input
│   ├── should handle file upload input
│   ├── should decrement quota on success
│   └── should return 429 when quota exceeded
│
├── generateThumbnails
│   ├── should return generated concepts
│   ├── should support CTR-optimized mode
│   ├── should support free-form mode
│   ├── should include face reference when enabled
│   └── should return 429 when quota exceeded
│
├── getFaceReference
│   ├── should return face data when exists
│   ├── should return 404 when no face uploaded (empty state)
│   └── should require authentication
│
├── uploadFaceReference
│   ├── should store face reference
│   ├── should validate image format
│   └── should replace existing reference
│
├── deleteFaceReference
│   ├── should remove face reference
│   └── should require authentication
│
└── getQuota
    ├── should return current quota status
    ├── should include audit and generate limits
    └── should reset daily
```

### 2.5 Pass/NFT APIs

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/pass.ts` | Mint, transfer, access check | 🟠 P1 |
| `src/api/onchainPass.ts` | On-chain verification | 🟠 P1 |

**Test Cases:**
```
Pass API
├── checkAccess
│   ├── should return true when user owns pass
│   ├── should return false when no pass owned
│   └── should handle on-chain verification
│
├── mintPass
│   ├── should create new pass NFT
│   ├── should require payment
│   └── should update user's pass list
│
└── getSignedUrl
    ├── should return signed URL for gated content
    ├── should require valid pass ownership
    └── should expire after TTL
```

### 2.6 Comments API

| File | Endpoints | Priority |
|------|-----------|----------|
| `src/api/comment.ts` | CRUD, replies, moderation | 🟡 P2 |

**Test Cases:**
```
Comment API
├── getComments
│   ├── should return comments for video
│   ├── should support pagination
│   └── should include nested replies
│
├── createComment
│   ├── should create comment when authenticated
│   ├── should support replies (parentId)
│   └── should validate content length
│
├── deleteComment
│   ├── should delete own comment
│   ├── should allow channel owner to delete
│   └── should cascade delete replies
│
└── likeComment
    ├── should toggle like state
    └── should update like count
```

### 2.7 Other APIs

| File | Priority | Notes |
|------|----------|-------|
| `src/api/thumbnail.ts` | 🟡 P2 | Public thumbnail generation |
| `src/api/analytics.ts` | 🟡 P2 | Creator analytics |
| `src/api/search.ts` | 🟡 P2 | Search functionality |
| `src/api/leaderboard.ts` | ⚪ P3 | Gamification |
| `src/api/userPoints.ts` | ⚪ P3 | Points system |
| `src/api/shareApi.ts` | ⚪ P3 | Social sharing |
| `src/api/youtube.ts` | ⚪ P3 | YouTube import |
| `src/api/embed.ts` | ⚪ P3 | Embed functionality |

---

## Phase 3: Hooks Layer (P1-P2)

### 3.1 Auth Hooks

| Hook | Priority | Tests Required |
|------|----------|----------------|
| `useRequireAuth` | 🔴 P0 | Modal trigger, redirect, callback |
| `useWeb3Auth` | 🔴 P0 | Connect, disconnect, sign message |
| `useCurrentUser` | 🟠 P1 | User data fetch, cache |
| `useTokenGate` | 🟠 P1 | Access check, signed URL fetch |

### 3.2 Feature Hooks

| Hook | Priority | Tests Required |
|------|----------|----------------|
| `useCTREngine` | 🟠 P1 | Audit flow, quota management |
| `useAnonymousStudio` | 🟠 P1 | Anonymous session, generation polling, output URL renewal |
| `useComments` | 🟡 P2 | CRUD, optimistic updates |
| `usePass` | 🟠 P1 | Pass ownership, signed URL |
| `useOnchainPass` | 🟠 P1 | On-chain access verification |

### 3.3 Data Hooks

| Hook | Priority | Tests Required |
|------|----------|----------------|
| `useAnalyticsData` | 🟡 P2 | Data aggregation, date ranges |
| `useTrendingVideos` | 🟡 P2 | Fetch, pagination |
| `useDiscoveryFeed` | 🟡 P2 | Feed algorithm, infinite scroll |
| `useChannels` | 🟡 P2 | Channel list, subscription state |
| `useSearch` | 🟡 P2 | Query handling, results |

### 3.4 Utility Hooks

| Hook | Priority | Notes |
|------|----------|-------|
| `useLocalStorage` | ⚪ P3 | Generic utility |
| `useWindowSize` | ⚪ P3 | Responsive utilities |
| `usePreventScroll` | ⚪ P3 | Modal utilities |
| `useVideoProgress` | ⚪ P3 | Player state |

---

## Phase 4: Integration Tests (P1)

### 4.1 Critical Flows

```
Authentication Flows
├── Email Sign-up → Verify → Profile Setup
├── Email Sign-in → Dashboard Access
├── Web3 Connect → Sign Message → Profile Link
├── Session Expiry → Re-authentication
└── Logout → Clear State → Redirect

Creator Flows
├── Upload Video → Processing → Publish
├── Create Channel → Customize → Publish
├── CTR Audit → Review Results → Generate
└── Manage Subscriptions → Notifications

Viewer Flows
├── Browse → Watch → Like/Comment
├── Search → Filter → Results
├── Subscribe → Feed Updates
└── Purchase Pass → Access Gated Content
```

### 4.2 Error Scenarios

```
Error Handling
├── Network Errors
│   ├── Offline detection
│   ├── Retry logic
│   └── User feedback
│
├── Auth Errors
│   ├── Invalid credentials
│   ├── Session expired
│   └── Account locked
│
├── Rate Limiting
│   ├── Quota exceeded (CTR)
│   ├── API rate limits
│   └── Upload limits
│
└── Validation Errors
    ├── Form validation
    ├── File type/size
    └── Content restrictions
```

---

## Phase 5: E2E Tests (P2)

### 5.1 Playwright Test Suites

```
e2e/
├── auth/
│   ├── clerk-signin.spec.ts
│   ├── clerk-signup.spec.ts
│   ├── web3-connect.spec.ts
│   └── logout.spec.ts
│
├── creator/
│   ├── upload-video.spec.ts
│   ├── manage-channel.spec.ts
│   ├── ctr-audit.spec.ts
│   └── thumbnail-generate.spec.ts
│
├── viewer/
│   ├── browse-videos.spec.ts
│   ├── watch-video.spec.ts
│   ├── comments.spec.ts
│   └── subscriptions.spec.ts
│
└── pass/
    ├── purchase-pass.spec.ts
    └── access-gated.spec.ts
```

---

## Implementation Timeline

| Phase | Scope | Estimated Effort | Milestone |
|-------|-------|------------------|-----------|
| **1** | Auth unit tests + MSW setup | 3-4 days | Auth is bulletproof |
| **2** | API integration tests | 4-5 days | All endpoints covered |
| **3** | Hook unit tests | 3-4 days | Business logic verified |
| **4** | Integration flows | 3-4 days | Critical paths tested |
| **5** | E2E suite | 4-5 days | Full user journeys |

**Total: ~3-4 weeks** for comprehensive coverage

---

## MSW Mock Handlers Structure

```typescript
// src/mocks/handlers/index.ts
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...videoHandlers,
  ...channelHandlers,
  ...ctrHandlers,
  ...passHandlers,
  ...commentHandlers,
];

// src/mocks/handlers/auth.handlers.ts
export const authHandlers = [
  http.post('/api/v1/auth/login', loginHandler),
  http.post('/api/v1/auth/logout', logoutHandler),
  http.get('/api/v1/auth/session', sessionHandler),
  http.post('/api/v1/web3/nonce', nonceHandler),
  http.post('/api/v1/web3/verify', verifyHandler),
];
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Auth layer coverage | > 95% |
| API layer coverage | > 85% |
| Hook layer coverage | > 80% |
| Critical flows coverage | 100% |
| E2E success rate | > 98% |

---

## Next Steps

1. **Setup Phase**: Configure Vitest + MSW in the project
2. **Phase 1 Execution**: Start with `AuthContext` and `useRequireAuth` tests
3. **CI Integration**: Add test runs to GitHub Actions
4. **Coverage Reports**: Configure coverage thresholds

---

*Last updated: December 2024*

