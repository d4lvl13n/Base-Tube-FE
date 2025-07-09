# AI Thumbnail Landing Page Implementation & Distribution Guide

---

## 1. Overview

This document describes how to build and launch a focused landing page for the AI Thumbnail Generator, powered by the BaseTube Public API. The goal is to validate demand, drive user signups, and create a growth loop for both the thumbnail tool and the main BaseTube platform.

---

## 2. Frontend Implementation Guide

### 2.1 Tech Stack

- **Framework:** React - similar to beta.base.tube
- **API:** BaseTube Public API (`/api/public/v1/images/generate`)
- **Auth:** No login required for free tier; upgrade flow uses Clerk or email/password (similar to base.tube endpoint)
- **Deployment:**  similar

### 2.2 API Integration

#### a. Free Tier (No Auth)

- Use a shared "demo" API key (free tier) for anonymous users.
- Limit: 2-3 free thumbnails per user/session (tracked via localStorage or cookie).

#### b. Upgrade Flow (Account Creation)

- After free quota, prompt user to sign up (Clerk modal or custom form).
- On signup, generate a personal API key for the user (via `/api/keys`).
- Store API key in user profile (securely, not in localStorage).

#### c. Making a Request

```js
// Example: Generate thumbnail from prompt
async function generateThumbnail(prompt, apiKey, options = {}) {
  const res = await fetch('https://api.basetube.io/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      prompt,
      size: options.size || 'auto',
      quality: options.quality || 'high',
      style: options.style,
      n: options.variations || 2,
      async: options.async || false
    })
  });
  return await res.json();
}

// Example: Generate with reference image
async function generateWithReference(prompt, imageFile, apiKey) {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('image', imageFile);
  formData.append('size', '1536x1024');
  formData.append('quality', 'high');
  
  const res = await fetch('https://api.basetube.io/v1/images/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData
  });
  return await res.json();
}

// Example: Async generation with polling
async function generateAsync(prompt, apiKey) {
  // Start async job
  const startRes = await fetch('https://api.basetube.io/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, async: true })
  });
  
  if (startRes.status === 202) {
    const { jobId } = await startRes.json();
    
    // Poll for completion
    while (true) {
      const statusRes = await fetch(`https://api.basetube.io/v1/images/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      const status = await statusRes.json();
      
      if (status.data.status === 'completed') {
        return status.data.result;
      } else if (status.data.status === 'failed') {
        throw new Error(status.data.error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

#### d. UI/UX Flow

1. **Landing page:** "Generate free AI  thumbnails"
2. **Prompt input:** User enters video title/description, clicks "Generate"
3. **Show thumbnails:** Display up to 3 options, allow download
4. **Quota reached:** Show modal: "Create a free account to unlock more"
5. **Signup:** Clerk modal or custom form
6. **Upgrade:** After signup, issue personal API key, unlock higher quota

#### e. Environment Variables

- `NEXT_PUBLIC_API_BASE=https://api.basetube.io/v1`
- `NEXT_PUBLIC_DEMO_API_KEY=bt_test_...`
- `CLERK_PUBLISHABLE_KEY=...` (if using Clerk)
- `REDIS_URL=redis://localhost:6379` (for rate limiting)

#### f. New API Features

**Enhanced Generation Parameters:**
- `size`: '1024x1024' | '1536x1024' | '1024x1536' | 'auto'
- `quality`: 'medium' | 'high' 
- `style`: Custom style preset (e.g., 'MrBeast style', 'Minimalist')
- `n`: Number of variations (1-4)

**Reference Image Support:**
- Upload reference images for style inspiration
- Optional mask support for targeted editing
- Endpoint: `POST /v1/images/edit`

**Async Processing:**
- Add `async: true` to request body for background processing
- Returns `202` status with `jobId`
- Poll status with `GET /v1/images/job/{jobId}`

**Rate Limiting:**
- 10 requests per 10 minutes per IP+UserAgent
- SHA-256 hashed keys for privacy
- Redis-backed for distributed systems

---

## 3. Analytics & Tracking

- Integrate Google Analytics or Plausible for:
  - Page views
  - CTA clicks (generate, download, signup)
  - Conversion funnel (free → signup → paid)
- Track API usage per user (via backend)
- Optional: Track thumbnail downloads for watermarking/branding impact

---

## 4. Distribution Plan

### 4.1 SEO & Content

- Target keywords: "AI YouTube thumbnail generator", "free YouTube thumbnail maker", "AI thumbnail tool"
- Landing page copy: Clear H1, FAQ, comparison grid vs. Canva/Adobe
- Blog posts: "How to make YouTube thumbnails that get clicks", "Best AI tools for creators", "Case study: 10x CTR with AI thumbnails"
- OpenGraph & Twitter Card images for social sharing

### 4.2 Community & Influencer Outreach

- Post launch announcement in:
  - YouTube creator Facebook groups
  - r/NewTubers, r/YouTube, r/SmallYoutubers on Reddit
  - Indie Hackers, Product Hunt, Hacker News (Show HN)
- DM micro-influencers on YouTube/Twitter, offer free pro keys for review
- Partner with TubeBuddy/VidIQ for cross-promotion

### 4.3 Viral Growth Loops

- Add "Made with BaseTube AI" watermark on free tier images
- Chrome extension: "Generate AI thumbnail" button in YouTube Studio
- Referral program: "Invite a friend, get 10 extra thumbnails"

### 4.4 API-First Expansion

- Public API docs on landing page
- Invite other devs to build on top (TubeBuddy, Opus.pro, etc.)
- Offer 100 free API calls/month for integrations

---

## 5. KPIs & 90-Day Roadmap

### 5.1 Success Metrics

- 1,000+ unique users generate at least 1 thumbnail
- 100+ signups (email or Clerk)
- 10+ paid upgrades (if paywall enabled)
- < $1 CAC for first 100 users (organic/earned, not paid ads)
- 10+ backlinks from creator blogs/forums

### 5.2 Timeline

| Week | Milestone                                      |
|------|------------------------------------------------|
| 1    | Landing page live, free API key integration    |
| 2    | Analytics, quota logic, download tracking      |
| 3    | Clerk/signup flow, upgrade modal               |
| 4    | SEO content, blog posts, social launch         |
| 5-6  | Community outreach, influencer DMs             |
| 7-8  | Chrome extension MVP, referral program         |
| 9-12 | Monitor, iterate, launch paid tier if demand   |

---

## 6. Appendix: Sample React Hook

```js
import { useState } from 'react';

export function useThumbnailGenerator(apiKey) {
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [error, setError] = useState(null);

  async function generate(prompt) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.basetube.io/v1/images/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setThumbnails(data.data?.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { generate, thumbnails, loading, error };
}
```

---

**Contact:** dev@base.tube for API support or partnership inquiries.