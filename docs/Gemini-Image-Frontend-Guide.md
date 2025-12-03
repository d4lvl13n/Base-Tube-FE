# Gemini 3 Pro Image - Frontend Integration Guide

## Overview

The backend now uses **Gemini 3 Pro Image** (codename "Nano Banana Pro") as the default image generation model. This model offers:

- ✅ **Face consistency** - Generate thumbnails with the user's face preserved
- ✅ **Higher resolution** - Up to 4K output
- ✅ **More aspect ratios** - 10 options including 16:9, 9:16, 21:9
- ✅ **Faster generation** - ~10-20 seconds vs 30-60s

---

## What Changed

| Before | After |
|--------|-------|
| Only OpenAI `gpt-image-1` | **Gemini 3 Pro** (default) + OpenAI as fallback |
| 3 size options | 10 aspect ratios + 3 resolutions |
| No face consistency | **Face consistency supported** |

---

## API Changes

### 1. New Config Options

The `/api/v1/images/generate` endpoint now accepts additional config options:

```typescript
interface ThumbnailGenerationConfig {
  // NEW: Model selection (optional, defaults to 'gemini-3-pro')
  model?: 'gemini-3-pro' | 'gpt-image-1';
  
  // NEW: Gemini-specific options
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution?: '1K' | '2K' | '4K';
  includeFace?: boolean;  // Use stored face reference for consistency
  
  // EXISTING: OpenAI options (still work if model is 'gpt-image-1')
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  quality?: 'low' | 'medium' | 'high';
  style?: string;
  n?: number;
}
```

### 2. Request Examples

**Basic generation (uses Gemini by default):**
```json
POST /api/v1/images/generate
{
  "prompt": "Gaming thumbnail with neon colors and bold text",
  "config": {
    "aspectRatio": "16:9",
    "resolution": "1K"
  }
}
```

**With face consistency (user must have uploaded a face reference):**
```json
POST /api/v1/images/generate
{
  "prompt": "YouTuber excited about new product reveal",
  "config": {
    "aspectRatio": "16:9",
    "resolution": "2K",
    "includeFace": true
  }
}
```

**Force OpenAI model (if needed):**
```json
POST /api/v1/images/generate
{
  "prompt": "Abstract minimalist tech thumbnail",
  "config": {
    "model": "gpt-image-1",
    "size": "1536x1024",
    "quality": "high"
  }
}
```

---

## UI Updates Needed

### 1. Aspect Ratio Selector

Replace the old size dropdown with an aspect ratio selector:

```typescript
const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (YouTube)', recommended: true },
  { value: '9:16', label: '9:16 (Shorts/TikTok)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3 (Classic)' },
  { value: '3:2', label: '3:2 (Photo)' },
  { value: '21:9', label: '21:9 (Cinematic)' },
];

// Default to 16:9 for YouTube thumbnails
const [aspectRatio, setAspectRatio] = useState('16:9');
```

### 2. Resolution Selector

Add a resolution option (affects quality and generation time):

```typescript
const RESOLUTIONS = [
  { value: '1K', label: '1K (Fast)', description: '~1024px' },
  { value: '2K', label: '2K (Balanced)', description: '~2048px' },
  { value: '4K', label: '4K (High Quality)', description: '~4096px', premium: true },
];

const [resolution, setResolution] = useState('1K');
```

### 3. Face Consistency Toggle

Add a toggle for face consistency (only show if user has uploaded a face reference):

```typescript
// Check if user has face reference
const { data: faceRef } = useQuery(['faceReference'], () => 
  api.get('/api/v1/ctr/face-reference')
);

const hasFaceReference = !!faceRef?.faceReferenceKey;

// In UI
{hasFaceReference && (
  <Toggle
    label="Include my face"
    description="Generate thumbnail with your face for consistency"
    checked={includeFace}
    onChange={setIncludeFace}
  />
)}
```

### 4. Updated Generation Request

```typescript
const generateThumbnail = async (prompt: string) => {
  const response = await api.post('/api/v1/images/generate', {
    prompt,
    config: {
      // Gemini options (default)
      aspectRatio,
      resolution,
      includeFace: hasFaceReference && includeFace,
      
      // Number of variations
      n: 2,
    }
  });
  
  return response.data;
};
```

---

## Face Reference Management

Users can upload/manage their face reference image for consistent thumbnails.

### Upload Face Reference

```typescript
const uploadFaceReference = async (file: File) => {
  const formData = new FormData();
  formData.append('faceImage', file);
  
  const response = await api.post('/api/v1/ctr/face-reference', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
  // Returns: { faceReferenceKey: string, thumbnailUrl: string }
};
```

### Get Current Face Reference

```typescript
const getFaceReference = async () => {
  const response = await api.get('/api/v1/ctr/face-reference');
  return response.data;
  // Returns: { faceReferenceKey: string, thumbnailUrl: string } | null
};
```

### Delete Face Reference

```typescript
const deleteFaceReference = async () => {
  await api.delete('/api/v1/ctr/face-reference');
};
```

---

## Response Format

The response format remains the same:

```typescript
// Single image response
interface ThumbnailResponse {
  id: number;
  thumbnailUrl: string;
  thumbnailPath: string;
  shareUrl: string;
  prompt: string;
  model: 'gemini-3-pro-image-preview' | 'gpt-image-1';  // NEW: includes model used
}

// Multiple images response
interface MultiThumbnailResponse {
  thumbnails: ThumbnailResponse[];
  prompt: string;
  model: string;  // NEW
}
```

---

## Error Handling

New error cases to handle:

```typescript
const handleGenerationError = (error: any) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  
  switch (status) {
    case 422:
      // Content safety violation
      toast.error('Your prompt was flagged. Please modify it and try again.');
      break;
    case 429:
      // Rate limit / quota exceeded
      toast.error('Generation limit reached. Please try again later.');
      break;
    case 503:
      // Service unavailable (API not configured)
      toast.error('Image generation service is temporarily unavailable.');
      break;
    default:
      toast.error(message || 'Failed to generate thumbnail');
  }
};
```

---

## Migration Checklist

- [ ] Update config types to include new options
- [ ] Add aspect ratio selector (default: 16:9)
- [ ] Add resolution selector (default: 1K)
- [ ] Add face consistency toggle (if user has face reference)
- [ ] Update API call to include new config options
- [ ] Handle new error cases
- [ ] (Optional) Add face reference upload UI in settings

---

## Questions?

The backend automatically falls back gracefully:
- If Gemini is unavailable → Uses OpenAI
- If `includeFace: true` but no face reference → Generates without face
- Old requests without new options → Still work with defaults

