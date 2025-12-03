# CTR Thumbnail Engine - Frontend Implementation Guide

## Overview

This document provides comprehensive guidance for implementing the CTR Thumbnail Engine frontend. The backend exposes endpoints at `/api/v1/ctr/*` for thumbnail auditing, CTR-optimized generation, and face reference management.

---

## Table of Contents

1. [API Endpoints Reference](#api-endpoints-reference)
2. [Authentication Flow](#authentication-flow)
3. [Page Structure](#page-structure)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Error Handling](#error-handling)
9. [Quota Display](#quota-display)

---

## API Endpoints Reference

### Base URL
```
Production: https://beta.base.tube/api/v1/ctr
Development: http://localhost:3000/api/v1/ctr
```

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/audit` | Optional | Audit thumbnail by URL or base64 |
| POST | `/audit/youtube` | Optional | Audit by YouTube video URL |
| POST | `/generate` | Required | Generate CTR-optimized concepts |
| GET | `/niches` | None | List available niche presets |
| POST | `/face-reference` | Required | Upload face reference |
| GET | `/face-reference` | Required | Get user's face reference |
| DELETE | `/face-reference` | Required | Delete face reference |
| GET | `/quota` | Optional | Get quota status |

---

## Authentication Flow

### Anonymous Users
- Can use `/audit` and `/audit/youtube` (3 audits/day limit)
- Cannot use `/generate`
- Cannot upload face reference
- Quota tracked by IP hash

### Authenticated Users (Clerk)
- Include Clerk session token in requests
- Free tier: 10 audits/day, 5 generations/day
- Pro tier: Unlimited audits, 30 generations/day
- Can upload and manage face reference

### Request Headers
```typescript
// For authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${clerkToken}` // If using Clerk
};
```

---

## Page Structure

### Recommended Routes

```
/creator-hub/thumbnails/audit     → Thumbnail Audit Tool
/creator-hub/thumbnails/generate  → CTR Generator
/creator-hub/thumbnails/settings  → Face Reference Management
```

### Page: Thumbnail Audit (`/audit`)

**Purpose**: Analyze any thumbnail and get CTR score + improvement suggestions.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  CTR Thumbnail Audit                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │                 │  │  Overall Score: 7.2/10          │  │
│  │   Thumbnail     │  │  Confidence: High               │  │
│  │   Preview       │  │  Niche: Gaming                  │  │
│  │                 │  │                                 │  │
│  └─────────────────┘  │  Strengths:                     │  │
│                       │  ✓ High contrast colors         │  │
│  [Paste URL]          │  ✓ Clear focal point            │  │
│  [Upload Image]       │                                 │  │
│  [YouTube URL]        │  Weaknesses:                    │  │
│                       │  ✗ Text too small for mobile    │  │
│  [  Audit Now  ]      │  ✗ Missing face/emotion         │  │
│                       │                                 │  │
│                       │  Suggestions:                   │  │
│                       │  1. Increase text size by 30%   │  │
│                       │  2. Add expressive face         │  │
│                       └─────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Persona Votes (Optional - adds ~3s)                │   │
│  │  ☑ Include persona analysis                         │   │
│  │                                                     │   │
│  │  Casual Browser (18-24): ✓ Would click (85%)       │   │
│  │  "Bright colors caught my attention"               │   │
│  │                                                     │   │
│  │  Mobile Viewer (16-22): ✗ Wouldn't click (40%)     │   │
│  │  "Can't read the text on my phone"                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Quota: 2/10 audits used today                             │
└─────────────────────────────────────────────────────────────┘
```

### Page: CTR Generator (`/generate`)

**Purpose**: Generate 3 CTR-optimized thumbnail concepts from a video title.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  CTR Thumbnail Generator                      [Pro Feature] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Video Title *                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ How I Made $10,000 in One Day Trading Crypto        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Description (optional)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ In this video I share my exact strategy...          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Niche: [Auto-detect ▼]  [Gaming] [Tech] [Finance] ...     │
│                                                             │
│  Text Overlay (optional)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ $10K IN 1 DAY                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Options:                                                   │
│  ☑ Include my face (uses saved face reference)             │
│  Concepts: [3 ▼]  Quality: [High ▼]                        │
│                                                             │
│  [  Generate Thumbnails  ]                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Generated Concepts                                         │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │              │ │              │ │              │        │
│  │  Concept 1   │ │  Concept 2   │ │  Concept 3   │        │
│  │              │ │              │ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  Bold & Dramatic   Clean & Pro      Curiosity Gap          │
│  Score: 8.0        Score: 7.5       Score: 8.5             │
│  [Download] [Use]  [Download] [Use] [Download] [Use]       │
│                                                             │
│  Generation time: 45.2s                                     │
│  Quota: 3/5 generations used today                         │
└─────────────────────────────────────────────────────────────┘
```

### Page: Face Reference Settings (`/settings`)

**Purpose**: Upload and manage face reference for personalized thumbnails.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Face Reference Settings                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Face Reference                                        │
│  ┌─────────────────┐                                       │
│  │                 │  This image will be used when you     │
│  │   [Current      │  enable "Include my face" in the      │
│  │    Face         │  thumbnail generator.                 │
│  │    Image]       │                                       │
│  │                 │  Tips for best results:               │
│  └─────────────────┘  • Clear, well-lit photo              │
│                       • Face centered and visible          │
│  [Upload New]         • Neutral or expressive emotion      │
│  [Delete]             • High resolution (512x512 min)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Components

```typescript
// components/ctr/
├── ThumbnailAuditForm.tsx      // Input form for audit
├── ThumbnailAuditResult.tsx    // Display audit results
├── PersonaVotesDisplay.tsx     // Show persona voting results
├── CTRGeneratorForm.tsx        // Generation input form
├── GeneratedConceptCard.tsx    // Single concept display
├── GeneratedConceptsGrid.tsx   // Grid of generated concepts
├── NicheSelector.tsx           // Niche dropdown/pills
├── FaceReferenceUploader.tsx   // Face upload component
├── CTRQuotaDisplay.tsx         // Quota status display
├── ScoreGauge.tsx              // Visual score indicator
├── StrengthWeaknessList.tsx    // Strengths/weaknesses display
└── HeuristicScores.tsx         // Detailed heuristic breakdown
```

### TypeScript Interfaces

```typescript
// types/ctr.ts

interface ThumbnailAudit {
  overallScore: number;           // 1-10
  confidence: 'low' | 'medium' | 'high';
  heuristics: {
    mobileReadability: number;
    colorContrast: number;
    facePresence: boolean;
    faceEmotion: string | null;
    compositionScore: number;
    textOverlay: boolean;
    brightness: number;
    colorfulness: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  personaVotes?: PersonaVotes;
  detectedNiche: string;
  estimatedCTR?: {
    low: number;
    mid: number;
    high: number;
  };
}

interface PersonaVote {
  personaName: string;
  personaDescription: string;
  wouldClick: boolean;
  confidence: number;
  reasoning: string;
}

interface PersonaVotes {
  votes: PersonaVote[];
  aggregateScore: number;
  consensusLevel: 'unanimous' | 'strong' | 'mixed' | 'divided';
}

interface GeneratedConcept {
  id: string;
  thumbnailUrl: string;
  thumbnailPath: string;
  prompt: string;
  conceptName: string;
  conceptDescription: string;
  estimatedCTRScore: number;
}

interface CTRGenerationResponse {
  concepts: GeneratedConcept[];
  detectedNiche: string;
  generationTime: number;
  quotaInfo?: QuotaInfo;
}

interface QuotaInfo {
  used: number;
  limit: number;        // -1 means unlimited
  remaining: number;    // -1 means unlimited
}

interface CTRQuotaStatus {
  audit: QuotaInfo & { resetsAt: string };
  generate: QuotaInfo & { resetsAt: string };
  tier: 'anonymous' | 'free' | 'pro' | 'enterprise';
  isAnonymous: boolean;
  limits: {
    audit: { anonymous: number; free: number; pro: number };
    generate: { anonymous: number; free: number; pro: number };
  };
}

interface NicheOption {
  id: string;
  name: string;
  description: string;
}
```

---

## API Integration

### Fetch Quota Status

```typescript
// Call on page load and after each action
async function fetchQuotaStatus(): Promise<CTRQuotaStatus> {
  const response = await fetch('/api/v1/ctr/quota', {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
```

### Audit Thumbnail

```typescript
interface AuditRequest {
  imageUrl?: string;
  imageBase64?: string;
  includePersonas?: boolean;
  context?: {
    title?: string;
    description?: string;
    niche?: string;
    tags?: string[];
  };
}

async function auditThumbnail(request: AuditRequest): Promise<ThumbnailAudit> {
  const response = await fetch('/api/v1/ctr/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data.audit;
}
```

### Audit YouTube Thumbnail

```typescript
async function auditYouTubeThumbnail(
  youtubeUrl: string, 
  includePersonas: boolean = false
): Promise<{ audit: ThumbnailAudit; videoMetadata: any }> {
  const response = await fetch('/api/v1/ctr/audit/youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ youtubeUrl, includePersonas })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
```

### Generate CTR Thumbnails

```typescript
interface GenerateRequest {
  title: string;
  description?: string;
  niche?: string;           // 'auto' or specific niche
  textOverlay?: string;
  includeFace?: boolean;
  concepts?: number;        // 1-5, default 3
  quality?: 'low' | 'medium' | 'high';
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

async function generateCTRThumbnails(
  request: GenerateRequest
): Promise<CTRGenerationResponse> {
  const response = await fetch('/api/v1/ctr/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()  // Required - must be authenticated
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
```

### Fetch Niches

```typescript
async function fetchNiches(): Promise<NicheOption[]> {
  const response = await fetch('/api/v1/ctr/niches');
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data.niches;
}
```

### Face Reference Management

```typescript
// Upload face reference
async function uploadFaceReference(imageBase64: string): Promise<{
  faceReferenceKey: string;
  thumbnailUrl: string;
}> {
  const response = await fetch('/api/v1/ctr/face-reference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ imageBase64 })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

// Get current face reference
async function getFaceReference(): Promise<{
  hasFaceReference: boolean;
  thumbnailUrl?: string;
} | null> {
  const response = await fetch('/api/v1/ctr/face-reference', {
    headers: getAuthHeaders()
  });
  
  if (response.status === 404) return null;
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

// Delete face reference
async function deleteFaceReference(): Promise<void> {
  const response = await fetch('/api/v1/ctr/face-reference', {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
}
```

---

## UI/UX Guidelines

### Score Visualization

```typescript
// Color coding for scores
function getScoreColor(score: number): string {
  if (score >= 8) return 'green';    // Excellent
  if (score >= 6) return 'yellow';   // Good
  if (score >= 4) return 'orange';   // Needs work
  return 'red';                       // Poor
}

// Score labels
function getScoreLabel(score: number): string {
  if (score >= 9) return 'Exceptional';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Above Average';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Below Average';
  if (score >= 3) return 'Needs Improvement';
  return 'Poor';
}
```

### Loading States

```typescript
// Generation can take 30-60 seconds for 3 concepts
// Show progress indicator with estimated time

interface GenerationProgress {
  status: 'idle' | 'generating' | 'complete' | 'error';
  currentConcept?: number;
  totalConcepts?: number;
  elapsedTime?: number;
  estimatedTotal?: number;
}
```

### Persona Vote Display

```typescript
// Visual representation of persona consensus
function getConsensusIcon(level: string): string {
  switch (level) {
    case 'unanimous': return '🎯';  // All agree
    case 'strong': return '👍';     // Most agree
    case 'mixed': return '🤔';      // Split opinions
    case 'divided': return '⚖️';    // Very split
    default: return '❓';
  }
}
```

### Niche Pills/Tags

Display niches as clickable pills for easy selection:

```
[Gaming] [Tech] [Finance] [Fitness] [Cooking] [Vlog] 
[Education] [News] [Entertainment] [Music] [Beauty] [Travel]
```

---

## Error Handling

### Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| `ANONYMOUS_AUDIT_QUOTA_EXCEEDED` | Anonymous user hit limit | "Free limit reached. Sign in for more audits." |
| `AUDIT_QUOTA_EXCEEDED` | Authenticated user hit limit | "Daily audit limit reached. Resets at midnight UTC." |
| `GENERATE_QUOTA_EXCEEDED` | Generation limit hit | "Daily generation limit reached." |
| `AUTHENTICATION_REQUIRED` | Need to sign in | "Please sign in to use this feature." |
| `MISSING_IMAGE` | No image provided | "Please provide an image URL or upload an image." |
| `MISSING_TITLE` | No title for generation | "Please enter a video title." |
| `INVALID_URL` | Bad YouTube URL | "Please enter a valid YouTube URL." |
| `YOUTUBE_API_NOT_CONFIGURED` | `YT_API_KEY` not set | "YouTube analysis temporarily unavailable." |
| `RATE_LIMIT_EXCEEDED` | Too many requests | "Too many requests. Please wait a moment." |

### Error Display Component

```typescript
interface CTRError {
  code: string;
  message: string;
  quota?: QuotaInfo;
}

function CTRErrorDisplay({ error }: { error: CTRError }) {
  const isQuotaError = error.code.includes('QUOTA');
  const isAuthError = error.code === 'AUTHENTICATION_REQUIRED';
  
  return (
    <div className="error-container">
      <p>{error.message}</p>
      {isQuotaError && error.quota && (
        <p>Used: {error.quota.used}/{error.quota.limit}</p>
      )}
      {isAuthError && (
        <button onClick={signIn}>Sign In</button>
      )}
      {isQuotaError && !isAuthError && (
        <button onClick={goToUpgrade}>Upgrade to Pro</button>
      )}
    </div>
  );
}
```

---

## Quota Display

### Quota Component

```typescript
function CTRQuotaDisplay({ quota }: { quota: CTRQuotaStatus }) {
  const formatLimit = (limit: number) => limit === -1 ? '∞' : limit;
  
  return (
    <div className="quota-display">
      <div className="quota-item">
        <span>Audits</span>
        <span>{quota.audit.used}/{formatLimit(quota.audit.limit)}</span>
        <progress 
          value={quota.audit.used} 
          max={quota.audit.limit === -1 ? 100 : quota.audit.limit} 
        />
      </div>
      <div className="quota-item">
        <span>Generations</span>
        <span>{quota.generate.used}/{formatLimit(quota.generate.limit)}</span>
        <progress 
          value={quota.generate.used} 
          max={quota.generate.limit === -1 ? 100 : quota.generate.limit} 
        />
      </div>
      <p className="reset-time">
        Resets at {new Date(quota.audit.resetsAt).toLocaleTimeString()}
      </p>
      {quota.tier === 'free' && (
        <a href="/pricing">Upgrade to Pro for more</a>
      )}
    </div>
  );
}
```

### Quota Limits Reference

| Tier | Audits/Day | Generations/Day |
|------|------------|-----------------|
| Anonymous | 3 | 0 |
| Free | 10 | 5 |
| Pro | Unlimited | 30 |
| Enterprise | Unlimited | Unlimited |

---

## Testing Checklist

### Audit Flow
- [ ] Audit by image URL works
- [ ] Audit by image upload works
- [ ] Audit by YouTube URL works
- [ ] Persona voting toggle works
- [ ] Context (title, niche) improves results
- [ ] Quota decrements after successful audit
- [ ] Quota exceeded error shows correctly
- [ ] Anonymous vs authenticated limits differ

### Generation Flow
- [ ] Requires authentication
- [ ] Title is required
- [ ] Niche auto-detection works
- [ ] Manual niche selection works
- [ ] Text overlay appears in thumbnails
- [ ] Face reference toggle works
- [ ] 1-5 concepts can be generated
- [ ] Quality settings affect output
- [ ] Download buttons work
- [ ] Quota decrements after success

### Face Reference
- [ ] Upload by base64 works
- [ ] Upload by file works
- [ ] Preview shows after upload
- [ ] Delete removes reference
- [ ] "Include my face" uses reference

### Error States
- [ ] Network errors handled gracefully
- [ ] Quota exceeded shows upgrade prompt
- [ ] Invalid inputs show validation errors
- [ ] Loading states during API calls

---

## Performance Considerations

1. **Generation is slow** (30-60s for 3 concepts)
   - Show progress indicator
   - Allow user to navigate away and return
   - Consider WebSocket for real-time updates (future)

2. **Cache quota status**
   - Fetch on page load
   - Update after each action
   - Don't re-fetch on every render

3. **Image optimization**
   - Compress images before upload
   - Use appropriate thumbnail sizes for display
   - Lazy load concept images

4. **Debounce inputs**
   - Don't call API on every keystroke
   - Debounce title/description inputs

---

## Future Enhancements (Phase 2)

1. **A/B Testing Integration** - Compare thumbnails with real CTR data
2. **Thumbnail History** - View past audits and generations
3. **Competitor Analysis** - Compare against top-performing videos in niche
4. **Batch Audit** - Audit multiple thumbnails at once
5. **Real-time Collaboration** - Share audit results with team
6. **InstantID Face Consistency** - Better face preservation in generation

