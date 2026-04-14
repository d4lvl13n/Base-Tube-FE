/**
 * MSW Handlers for CTR Engine APIs
 * Covers audit, generate, face-reference, and quota endpoints
 */

import { http, HttpResponse, delay } from 'msw';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ============================================================
// FIXTURES
// ============================================================

export const mockQuota = {
  audit: { used: 3, limit: 10, remaining: 7, resetsAt: new Date(Date.now() + 86400000).toISOString() },
  generate: { used: 5, limit: 20, remaining: 15, resetsAt: new Date(Date.now() + 86400000).toISOString() },
  tier: 'free',
  isAnonymous: false,
  limits: {
    audit: { anonymous: 3, free: 10, pro: 100, enterprise: -1 },
    generate: { anonymous: 1, free: 20, pro: 100, enterprise: -1 },
  },
};

export const mockAuditResult = {
  overallScore: 7.8,
  confidence: 'high',
  heuristics: {
    mobileReadability: 8.5,
    colorContrast: 7.2,
    facePresence: true,
    faceEmotion: 'excited',
    compositionScore: 7.6,
    textOverlay: true,
    brightness: 6.8,
    colorfulness: 7.9,
  },
  detectedNiche: 'technology',
  estimatedCTR: { low: 4.2, mid: 5.5, high: 6.8 },
  strengths: [
    'Readable on mobile',
    'Strong emotional expression',
  ],
  weaknesses: [
    'Text contrast could be stronger',
  ],
  suggestions: [
    'Increase face prominence',
    'Add more vibrant colors',
  ],
};

export const mockGeneratedConcepts = [
  {
    id: 'concept-1',
    thumbnailUrl: 'https://example.com/thumbnail-1.jpg',
    thumbnailPath: '/generated/thumbnail-1.jpg',
    prompt: 'Tech review thumbnail',
    conceptName: 'High-energy reaction',
    conceptDescription: 'Creator reaction with bold product framing',
    estimatedCTRScore: 8.2,
  },
  {
    id: 'concept-2',
    thumbnailUrl: 'https://example.com/thumbnail-2.jpg',
    thumbnailPath: '/generated/thumbnail-2.jpg',
    prompt: 'Tech review thumbnail',
    conceptName: 'Comparison layout',
    conceptDescription: 'Side-by-side reveal with strong focal point',
    estimatedCTRScore: 7.9,
  },
  {
    id: 'concept-3',
    thumbnailUrl: 'https://example.com/thumbnail-3.jpg',
    thumbnailPath: '/generated/thumbnail-3.jpg',
    prompt: 'Tech review thumbnail',
    conceptName: 'Minimal contrast',
    conceptDescription: 'Simplified composition with strong typography',
    estimatedCTRScore: 7.5,
  },
];

export const mockFaceReference = {
  hasFaceReference: true,
  thumbnailUrl: 'https://example.com/face-reference.jpg',
  faceReferenceKey: 'face-ref-123',
};

// ============================================================
// QUOTA HANDLERS
// ============================================================

export const quotaHandlers = [
  // GET /api/v1/ctr/quota - Get user quota status
  http.get(`${API_BASE}/api/v1/ctr/quota`, async ({ request }) => {
    await delay(50);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: mockQuota,
    });
  }),
];

// ============================================================
// AUDIT HANDLERS
// ============================================================

export const auditHandlers = [
  // POST /api/v1/ctr/audit - Audit a thumbnail
  http.post(`${API_BASE}/api/v1/ctr/audit`, async ({ request }) => {
    await delay(500); // Simulate processing time
    
    const authHeader = request.headers.get('Authorization');
    
    // Allow both authenticated and anonymous users
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    // Check quota for authenticated users
    if (isAuthenticated && mockQuota.audit.used >= mockQuota.audit.limit) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUDIT_QUOTA_EXCEEDED', message: 'Daily audit quota exceeded' } },
        { status: 429 }
      );
    }
    
    const contentType = request.headers.get('Content-Type') || '';
    
    // Handle both JSON (URL) and FormData (file upload)
    if (contentType.includes('application/json')) {
      const body = await request.json() as { imageUrl?: string; title?: string };
      
      if (!body?.imageUrl) {
        return HttpResponse.json(
          { success: false, message: 'Image URL is required' },
          { status: 400 }
        );
      }
    }
    
    // Increment quota (in real tests, this would be tracked differently)
    mockQuota.audit.used++;
    mockQuota.audit.remaining = Math.max(mockQuota.audit.limit - mockQuota.audit.used, 0);
    
    return HttpResponse.json({
      success: true,
      data: {
        audit: mockAuditResult,
        auditId: 123,
        quotaInfo: mockQuota.audit,
      },
    });
  }),
];

// ============================================================
// GENERATE HANDLERS
// ============================================================

export const generateHandlers = [
  // POST /api/v1/ctr/generate - Generate thumbnails
  http.post(`${API_BASE}/api/v1/ctr/generate`, async ({ request }) => {
    await delay(2000); // Simulate generation time
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Check quota
    if (mockQuota.generate.used >= mockQuota.generate.limit) {
      return HttpResponse.json(
        { success: false, error: { code: 'GENERATE_QUOTA_EXCEEDED', message: 'Daily generation quota exceeded' } },
        { status: 429 }
      );
    }
    
    const body = await request.json() as { 
      prompt?: string;
      title?: string;
      mode?: 'creative' | 'ctr';
    };
    
    if (!body?.prompt && !body?.title) {
      return HttpResponse.json(
        { success: false, error: { code: 'MISSING_TITLE', message: 'Prompt or title is required' } },
        { status: 400 }
      );
    }
    
    mockQuota.generate.used++;
    mockQuota.generate.remaining = Math.max(mockQuota.generate.limit - mockQuota.generate.used, 0);
    
    return HttpResponse.json({
      success: true,
      data: {
        concepts: mockGeneratedConcepts,
        detectedNiche: 'technology',
        generationTime: 2000,
        quotaInfo: mockQuota.generate,
      },
    });
  }),
];

// ============================================================
// FACE REFERENCE HANDLERS
// ============================================================

export const faceReferenceHandlers = [
  // GET /api/v1/ctr/face-reference - Get user's face reference
  http.get(`${API_BASE}/api/v1/ctr/face-reference`, async ({ request }) => {
    await delay(50);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Simulate no face reference uploaded (404 = empty state)
    const hasFaceReference = true; // Toggle this for testing
    
    if (!hasFaceReference) {
      return HttpResponse.json(
        { success: false, message: 'No face reference found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: mockFaceReference,
    });
  }),

  // POST /api/v1/ctr/face-reference - Upload face reference
  http.post(`${API_BASE}/api/v1/ctr/face-reference`, async ({ request }) => {
    await delay(200);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        faceReferenceKey: `face-ref-${Date.now()}`,
        thumbnailUrl: mockFaceReference.thumbnailUrl,
      },
    });
  }),

  // DELETE /api/v1/ctr/face-reference - Delete face reference
  http.delete(`${API_BASE}/api/v1/ctr/face-reference`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Face reference deleted',
    });
  }),
];

// ============================================================
// GALLERY HANDLERS
// ============================================================

export const galleryHandlers = [
  // GET /api/v1/users/me/thumbnails - Get user's generated thumbnails
  http.get(`${API_BASE}/api/v1/users/me/thumbnails`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Generate mock thumbnails
    const thumbnails = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `thumb-${offset + i}`,
      thumbnailUrl: `https://example.com/thumbnail-${offset + i}.jpg`,
      prompt: `Generated thumbnail ${offset + i}`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
    
    return HttpResponse.json({
      success: true,
      data: {
        thumbnails,
        total: 50,
        limit,
        offset,
      },
    });
  }),

  // DELETE /api/v1/users/me/thumbnails/:id - Delete a thumbnail
  http.delete(`${API_BASE}/api/v1/users/me/thumbnails/:id`, async ({ request, params }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: `Thumbnail ${params.id} deleted`,
    });
  }),
];

// ============================================================
// COMBINED HANDLERS
// ============================================================

export const ctrHandlers = [
  ...quotaHandlers,
  ...auditHandlers,
  ...generateHandlers,
  ...faceReferenceHandlers,
  ...galleryHandlers,
];
