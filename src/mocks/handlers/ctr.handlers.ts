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
  audit: { used: 3, limit: 10, resetAt: new Date(Date.now() + 86400000).toISOString() },
  generate: { used: 5, limit: 20, resetAt: new Date(Date.now() + 86400000).toISOString() },
};

export const mockAuditResult = {
  id: 'audit-123',
  score: 78,
  metrics: {
    faceProminence: { score: 85, label: 'Excellent' },
    emotionalAppeal: { score: 72, label: 'Good' },
    textClarity: { score: 80, label: 'Very Good' },
    colorContrast: { score: 75, label: 'Good' },
  },
  niche: 'Technology',
  estimatedCTR: { min: 4.2, max: 6.8 },
  suggestions: [
    'Increase face prominence',
    'Add more vibrant colors',
  ],
  analyzedAt: new Date().toISOString(),
};

export const mockGeneratedConcepts = [
  {
    id: 'concept-1',
    thumbnailUrl: 'https://example.com/thumbnail-1.jpg',
    prompt: 'Tech review thumbnail',
    score: 82,
  },
  {
    id: 'concept-2',
    thumbnailUrl: 'https://example.com/thumbnail-2.jpg',
    prompt: 'Tech review thumbnail',
    score: 79,
  },
  {
    id: 'concept-3',
    thumbnailUrl: 'https://example.com/thumbnail-3.jpg',
    prompt: 'Tech review thumbnail',
    score: 75,
  },
];

export const mockFaceReference = {
  id: 'face-ref-123',
  imageUrl: 'https://example.com/face-reference.jpg',
  uploadedAt: '2024-01-01T00:00:00Z',
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
        { success: false, message: 'Daily audit quota exceeded' },
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
    
    return HttpResponse.json({
      success: true,
      data: mockAuditResult,
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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check quota
    if (mockQuota.generate.used >= mockQuota.generate.limit) {
      return HttpResponse.json(
        { success: false, message: 'Daily generation quota exceeded' },
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
        { success: false, message: 'Prompt or title is required' },
        { status: 400 }
      );
    }
    
    mockQuota.generate.used++;
    
    return HttpResponse.json({
      success: true,
      data: {
        concepts: mockGeneratedConcepts,
        jobId: `job-${Date.now()}`,
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
        ...mockFaceReference,
        id: `face-ref-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
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

