# Backend Implementation: AI Thumbnail Generator - Clerk Integration

## Overview

This document specifies backend enhancements to integrate the AI Thumbnail Generator into the Base.Tube ecosystem using existing Clerk authentication. The approach prioritizes simplicity by reusing existing infrastructure rather than building parallel systems.

**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Existing Clerk auth, Redis, thumbnails table, Storj storage

---

## Architecture Overview

### Two Separate Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL CUSTOMERS                                   │
│              (Other apps that buy API access from you)                       │
│                                                                              │
│   They manage their own user quotas however they want.                       │
│   You just bill them for API usage via API key rate limits.                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ API Key (x-api-key header)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PUBLIC API (Your Product)                                 │
│                                                                              │
│   POST /v1/images/generate     - Generate thumbnails                         │
│   POST /v1/images/edit         - Edit with reference image                   │
│   GET  /v1/images/job/:jobId   - Check async job status                      │
│   GET  /v1/images/usage        - API key usage stats                         │
│                                                                              │
│   Auth: API Key required                                                     │
│   Rate Limits: Per API key (managed by apiRateLimiter)                       │
│   Billing: Per API key (tracked by billingTracker)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │ API Key (your own internal key)
                                │
┌───────────────────────────────┴─────────────────────────────────────────────┐
│                    BASE.TUBE LANDING PAGE DEMO                               │
│                                                                              │
│   Frontend Flow:                                                             │
│   1. Check quota:     GET  /v1/images/quota                                  │
│   2. If OK, generate: POST /v1/images/generate (with your API key)           │
│   3. On success:      POST /v1/images/quota/increment                        │
│                                                                              │
│   Quota Limits:                                                              │
│   • Anonymous: 1/day (IP-based)                                              │
│   • Free tier: 10/day (Clerk user)                                           │
│   • Pro tier:  50/day (Clerk user + subscription)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Insight

The **quota system is separate from the API**. External customers don't use your quota endpoints - they have their own rate limits via API keys. The quota endpoints exist **only** for the Base.Tube landing page demo to gate free usage.

---

## Implementation Status

| Job | Description | Status |
|-----|-------------|--------|
| Job 1 | Anonymous Rate Limiting (1/day IP-based) | ✅ **IMPLEMENTED** |
| Job 2 | Authenticated User Quota System (tier-based) | ✅ **IMPLEMENTED** |
| Job 3 | User Thumbnail Gallery | ✅ **IMPLEMENTED** |
| Job 4 | Shareable Thumbnail URLs with OG Tags | ✅ **IMPLEMENTED** |
| Job 5 | Email Capture for Anonymous Downloads | ⏳ **PENDING** |
| DB Migration | Add `short_id` column to `ai_thumbnails` | ✅ **CREATED** (needs to run) |

---

## API Reference

### Public API Endpoints (API Key Required)

These are your **product endpoints** that external customers use.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/images/generate` | API Key | Generate thumbnails |
| POST | `/v1/images/edit` | API Key | Edit with reference image |
| GET | `/v1/images/job/:jobId` | API Key | Check async job status |
| GET | `/v1/images/usage` | API Key | API key usage statistics |

### Quota Endpoints (For Landing Page Demo)

These endpoints manage Clerk-based quotas for the Base.Tube landing page.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/images/quota` | Optional Clerk | Check current quota |
| POST | `/v1/images/quota/increment` | Optional Clerk | Increment quota after generation |

### User Gallery Endpoints (Clerk Required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/me/thumbnails` | Clerk | User's thumbnail gallery |
| GET | `/api/v1/users/me/thumbnails/:id` | Clerk | Single thumbnail details |
| DELETE | `/api/v1/users/me/thumbnails/:id` | Clerk | Delete from gallery |

### Share Endpoints (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/t/:shortId` | None | Shareable page with OG tags |
| GET | `/t/:shortId/image` | None | Direct image redirect |

---

## Quota System Details

### Quota Tiers

| Tier | Daily Limit | How to Detect |
|------|-------------|---------------|
| Anonymous | 1 | No Clerk session (IP-based) |
| Free | 10 | Clerk user, no subscription |
| Pro | 50 | Clerk user + Pro subscription |
| Enterprise | Unlimited | Clerk user + Enterprise subscription |

### Redis Key Structure

```
thumbnail:anon:daily:{ip_hash}     →  count (INT), TTL: midnight UTC
thumbnail:user:daily:{clerkUserId} →  count (INT), TTL: midnight UTC
```

### GET /v1/images/quota Response

```json
{
  "success": true,
  "data": {
    "used": 3,
    "limit": 10,
    "remaining": 7,
    "isAnonymous": false,
    "tier": "free",
    "resetsAt": "2024-12-01T00:00:00.000Z",
    "upgradeUrl": "/pricing"
  }
}
```

### POST /v1/images/quota/increment Response

```json
{
  "success": true,
  "data": {
    "used": 4,
    "limit": 10,
    "remaining": 6,
    "isAnonymous": false,
    "tier": "free",
    "resetsAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### Quota Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "ANONYMOUS_QUOTA_EXCEEDED",
    "message": "Free daily limit reached. Create a free account for 10 daily generations.",
    "used": 1,
    "limit": 1,
    "remaining": 0,
    "isAnonymous": true,
    "tier": "anonymous",
    "resetsAt": "2024-12-01T00:00:00.000Z",
    "upgradeUrl": "/sign-up?redirect=/creator-hub/thumbnails"
  }
}
```

---

## Frontend Integration Guide

### Complete Flow

```typescript
const API_URL = 'https://beta.base.tube';
const API_KEY = 'your-internal-api-key'; // Your own API key for the demo

// Step 1: Check quota before showing generate button
async function checkQuota(): Promise<QuotaInfo> {
  const response = await fetch(`${API_URL}/v1/images/quota`, {
    credentials: 'include' // Send Clerk cookies
  });
  const { data } = await response.json();
  return data;
}

// Step 2: Generate thumbnail (only if quota allows)
async function generateThumbnail(prompt: string, options: GenerateOptions) {
  // First check quota
  const quota = await checkQuota();
  
  if (quota.remaining <= 0) {
    showUpgradePrompt(quota.upgradeUrl, quota.message);
    return null;
  }
  
  // Call the actual API with your API key
  const response = await fetch(`${API_URL}/v1/images/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY  // Your internal API key
    },
    body: JSON.stringify({ prompt, ...options })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  // Step 3: Increment quota after successful generation
  await incrementQuota();
  
  return result.data;
}

// Step 3: Increment quota after success
async function incrementQuota(): Promise<QuotaInfo> {
  const response = await fetch(`${API_URL}/v1/images/quota/increment`, {
    method: 'POST',
    credentials: 'include' // Send Clerk cookies
  });
  const { data } = await response.json();
  
  // Update UI with new quota
  updateQuotaDisplay(data);
  
  return data;
}

// Helper: Update quota display in UI
function updateQuotaDisplay(quota: QuotaInfo) {
  if (quota.isAnonymous) {
    setQuotaText(`${quota.remaining} free generation remaining`);
  } else {
    setQuotaText(`${quota.remaining} of ${quota.limit} remaining today`);
  }
  
  if (quota.remaining <= 0) {
    disableGenerateButton();
    showUpgradePrompt(quota.upgradeUrl, quota.message);
  }
}
```

### TypeScript Types

```typescript
interface QuotaInfo {
  used: number;           // Thumbnails generated today
  limit: number;          // Daily limit (-1 = unlimited)
  remaining: number;      // Remaining today (-1 = unlimited)
  isAnonymous: boolean;   // true if no Clerk session
  tier: 'anonymous' | 'free' | 'pro' | 'enterprise';
  resetsAt: string;       // ISO timestamp (midnight UTC)
  upgradeUrl?: string;    // Only for anonymous/free users
  message?: string;       // Human-readable status when quota exceeded
}
```

### Handling Async Jobs

For long-running generations, the API returns a job ID:

```typescript
async function generateWithPolling(prompt: string, options: GenerateOptions) {
  const quota = await checkQuota();
  if (quota.remaining <= 0) {
    showUpgradePrompt(quota.upgradeUrl, quota.message);
    return null;
  }
  
  // Request async processing
  const response = await fetch(`${API_URL}/v1/images/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ prompt, async: true, ...options })
  });
  
  const { jobId } = await response.json();
  
  // Poll for completion
  const result = await pollJobStatus(jobId);
  
  // Increment quota after success
  await incrementQuota();
  
  return result;
}

async function pollJobStatus(jobId: string): Promise<ThumbnailResult> {
  const maxAttempts = 60;
  const pollInterval = 2000;
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_URL}/v1/images/job/${jobId}`, {
      headers: { 'x-api-key': API_KEY }
    });
    const { data } = await response.json();
    
    if (data.status === 'completed') return data.result;
    if (data.status === 'failed') throw new Error(data.error);
    
    await new Promise(r => setTimeout(r, pollInterval));
  }
  
  throw new Error('Generation timed out');
}
```

### Load User Gallery

```typescript
async function loadUserGallery(page = 0) {
  const limit = 20;
  const offset = page * limit;
  
  const response = await fetch(
    `${API_URL}/api/v1/users/me/thumbnails?limit=${limit}&offset=${offset}`,
    { credentials: 'include' }
  );
  
  if (response.status === 401) {
    showSignInPrompt();
    return;
  }
  
  const { data } = await response.json();
  
  setThumbnails(data.thumbnails);
  setPagination(data.pagination);
  setQuotaInfo(data.quotaInfo);
}
```

### Share Thumbnail

```typescript
function shareThumbnail(thumbnail: Thumbnail) {
  const shareUrl = thumbnail.shareUrl; // e.g., "https://base.tube/t/Xk9mP2qL"
  
  if (navigator.share) {
    navigator.share({
      title: 'AI Thumbnail',
      text: 'Check out this AI thumbnail I made!',
      url: shareUrl
    });
  } else {
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard!');
  }
}
```

---

## User Gallery Details

### GET /api/v1/users/me/thumbnails

**Auth:** Clerk required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | int | 20 | Items per page (max 100) |
| offset | int | 0 | Pagination offset |
| sort | string | created_at | Sort field: `created_at`, `download_count`, `id` |
| order | string | desc | Sort order: `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "data": {
    "thumbnails": [
      {
        "id": 123,
        "thumbnailUrl": "https://link.storjshare.io/...",
        "prompt": "Gaming thumbnail with neon lights",
        "size": "1536x1024",
        "quality": "high",
        "style": "vibrant",
        "downloadCount": 3,
        "createdAt": "2024-01-15T10:30:00Z",
        "shareUrl": "https://base.tube/t/Xk9mP2qL"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "quotaInfo": {
      "used": 7,
      "limit": 10,
      "remaining": 3,
      "isAnonymous": false,
      "tier": "free",
      "resetsAt": "2024-01-16T00:00:00Z"
    }
  }
}
```

---

## Shareable URLs

### How It Works

1. Each thumbnail gets a `short_id` (8 chars, nanoid) on creation
2. Share URL format: `https://base.tube/t/{shortId}`
3. When shared on social media, crawlers get OG-tagged HTML
4. Regular users are redirected to `/ai-thumbnails?ref={shortId}`

### GET /t/:shortId

**For Social Crawlers:** Returns HTML with Open Graph tags:
- `og:title`: "AI-Generated Thumbnail | Base.Tube"
- `og:description`: Prompt preview (150 chars)
- `og:image`: Signed thumbnail URL
- `twitter:card`: "summary_large_image"

**For Regular Users:** 302 redirect to `/ai-thumbnails?ref={shortId}&prompt={prompt}`

---

## Database Migration

### Migration File

`migrations/20251130_add_short_id_to_ai_thumbnails.sql`

```sql
-- Add short_id column
ALTER TABLE ai_thumbnails ADD COLUMN short_id VARCHAR(10) NULL AFTER id;

-- Create unique index
CREATE UNIQUE INDEX idx_ai_thumbnails_short_id ON ai_thumbnails(short_id);

-- Create index for user gallery queries
CREATE INDEX idx_ai_thumbnails_created_by_created_at ON ai_thumbnails(created_by, created_at DESC);
```

### Run Migration

```bash
mysql -u root -p basetube < migrations/20251130_add_short_id_to_ai_thumbnails.sql
```

---

## Environment Variables

```bash
# Required for share URLs
APP_URL=https://base.tube

# Redis (already configured)
REDIS_URL=redis://localhost:6379

# Clerk (already configured)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Testing Checklist

### Quota Flow
- [ ] `GET /v1/images/quota` returns correct quota for anonymous user
- [ ] `GET /v1/images/quota` returns correct quota for Clerk user
- [ ] `POST /v1/images/quota/increment` increments quota
- [ ] Returns 429 when quota exceeded
- [ ] Quota resets at midnight UTC

### Generation Flow
- [ ] Frontend checks quota before generation
- [ ] Frontend calls `/generate` with API key
- [ ] Frontend calls `/quota/increment` after success
- [ ] Anonymous user blocked after 1 generation
- [ ] Free tier user blocked after 10 generations

### Gallery Flow
- [ ] `GET /api/v1/users/me/thumbnails` returns user's thumbnails
- [ ] Pagination works correctly
- [ ] Delete removes from storage and database

### Share Flow
- [ ] Share URL returns OG tags for crawlers
- [ ] Share URL redirects regular users
- [ ] `/t/:shortId/image` redirects to actual image

---

## Security Considerations

1. **IP Hashing**: SHA256 truncated hash for anonymous tracking (privacy-preserving)
2. **Clerk Cookies**: Frontend must send `credentials: 'include'` for auth detection
3. **API Key Security**: Don't expose your internal API key in client-side code (use environment variables or a backend proxy)
4. **Signed URLs**: All image URLs are time-limited signed URLs from Storj

---

## Pending Work

### Job 5: Email Capture for Anonymous Downloads

**Purpose:** Capture leads when anonymous users download their thumbnail.

**Proposed Endpoint:** `POST /v1/images/capture-email`

```json
// Request
{
  "email": "user@example.com",
  "thumbnailId": 123
}

// Response
{
  "success": true,
  "data": {
    "downloadUrl": "https://link.storjshare.io/...",
    "message": "Your download is ready!"
  }
}
```

---

## Frontend Implementation Status

### ✅ Already Implemented

| Component | File | Status |
|-----------|------|--------|
| **Clerk Auth Modals** | `ThumbnailLanding/index.tsx` | ✅ Complete - SignIn/SignUp with redirect to `/ai-thumbnails` |
| **Server-Side Quota Hook** | `usePublicThumbnailGenerator.ts` | ✅ Updated - Calls `/v1/images/quota` and `/quota/increment` |
| **User Gallery Support** | `usePublicThumbnailGenerator.ts` | ✅ Added - `loadGallery()`, `deleteFromGallery()` |
| **ThumbnailGallery Components** | `ThumbnailGallery/*.tsx` | ✅ Exists - Reusable Grid, Card, DetailDrawer |
| **Public Gallery Page** | `pages/thumbnail-gallery/index.tsx` | ✅ Exists - Shows all thumbnails with filters |
| **Email Capture (Formspree)** | `usePublicThumbnailGenerator.ts` | ✅ Temporary - Using Formspree until Job 5 backend is ready |

### ⏳ Remaining Frontend Work

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| **Quota Display Enhancement** | 🔴 High | 30 min | Update `CollapsibleThumbnailGenerator` to show tier-aware quota (`quotaInfo.tier`, `quotaInfo.upgradeUrl`) |
| **"My Thumbnails" Tab** | 🔴 High | 2 hrs | Add tab/section in ThumbnailLanding for authenticated users to view their personal gallery using `loadGallery()` |
| **Use `shareUrl` from API** | 🟠 Medium | 15 min | Update `ViralSharePopup` to use `thumbnail.shareUrl` instead of constructing URL |
| **Quota Exceeded UX** | 🟠 Medium | 30 min | Show tier-appropriate prompts: anonymous → "Sign up", free → "Upgrade", etc. |
| **Environment Variable** | 🟢 Low | 5 min | Ensure `REACT_APP_API_URL` is set in production |
| **Switch to Backend Email API** | 🟢 Low | 15 min | Replace Formspree with `/v1/images/capture-email` when Job 5 is deployed |

### Auth Architecture (Already In Place)

The Clerk auth integration is **already complete** in `ThumbnailLanding/index.tsx`:

```tsx
// Lines 191-237: SignIn modal with redirect to /ai-thumbnails
<SignIn
  routing="virtual"
  afterSignInUrl="/ai-thumbnails"
  appearance={{ baseTheme: dark, variables: { colorPrimary: '#fa7517', ... } }}
/>

// Lines 240-288: SignUp modal with redirect to /ai-thumbnails
<SignUp
  routing="virtual"
  afterSignUpUrl="/ai-thumbnails"
  appearance={{ baseTheme: dark, variables: { colorPrimary: '#fa7517', ... } }}
/>
```

**Key features:**
- Custom branded modals (Base.Tube orange theme)
- Virtual routing (no page navigation)
- Auto-redirect back to thumbnail generator after auth
- Triggered via `onSignInClick` / `onSignUpClick` from header and quota prompts

### Reusing Existing Gallery Components

The `ThumbnailGallery/` folder contains reusable components:

| Component | Use For |
|-----------|---------|
| `ThumbnailGrid.tsx` | Displaying thumbnails in responsive grid with loading/empty states |
| `ThumbnailCard.tsx` | Individual thumbnail card with hover effects |
| `ThumbnailDetailDrawer.tsx` | Full-screen drawer with download, copy prompt, share |

**For the "My Thumbnails" feature:**
1. Create a new tab/view in `ThumbnailLanding` for authenticated users
2. Use the existing `ThumbnailGrid` component
3. Feed it data from `usePublicThumbnailGenerator().gallery`
4. Use `ThumbnailDetailDrawer` for viewing details

---

**Author:** Architecture Review  
**Date:** November 2024  
**Last Updated:** November 30, 2024  
**Status:** Jobs 1-4 Backend Implemented, Job 5 Pending, Frontend Quota Integration Complete
