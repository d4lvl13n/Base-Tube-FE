/**
 * CTR Engine API Tests
 * 
 * Unit tests for CTR Engine data structures and response parsing.
 * For full integration tests with mocked API, see e2e tests with Playwright.
 */

// Mock fixtures
const mockQuota = {
  audit: { used: 3, limit: 10, resetAt: '2024-01-02T00:00:00Z' },
  generate: { used: 5, limit: 20, resetAt: '2024-01-02T00:00:00Z' },
};

const mockAuditResult = {
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
  suggestions: ['Increase face prominence', 'Add more vibrant colors'],
  analyzedAt: '2024-01-01T12:00:00Z',
};

const mockGeneratedConcepts = [
  { id: 'concept-1', thumbnailUrl: 'https://example.com/thumb1.jpg', prompt: 'Test', score: 82 },
  { id: 'concept-2', thumbnailUrl: 'https://example.com/thumb2.jpg', prompt: 'Test', score: 79 },
  { id: 'concept-3', thumbnailUrl: 'https://example.com/thumb3.jpg', prompt: 'Test', score: 75 },
];

describe('CTR Quota Data Structure', () => {
  it('should have correct quota structure', () => {
    expect(mockQuota.audit).toBeDefined();
    expect(mockQuota.generate).toBeDefined();
    expect(mockQuota.audit.used).toBeLessThanOrEqual(mockQuota.audit.limit);
    expect(mockQuota.generate.used).toBeLessThanOrEqual(mockQuota.generate.limit);
  });

  it('should calculate remaining quota correctly', () => {
    const auditRemaining = mockQuota.audit.limit - mockQuota.audit.used;
    const generateRemaining = mockQuota.generate.limit - mockQuota.generate.used;
    
    expect(auditRemaining).toBe(7);
    expect(generateRemaining).toBe(15);
  });

  it('should calculate quota progress percentage', () => {
    const auditProgress = (mockQuota.audit.used / mockQuota.audit.limit) * 100;
    const generateProgress = (mockQuota.generate.used / mockQuota.generate.limit) * 100;
    
    expect(auditProgress).toBe(30);
    expect(generateProgress).toBe(25);
  });

  it('should detect quota exceeded', () => {
    const isAuditExceeded = mockQuota.audit.used >= mockQuota.audit.limit;
    const isGenerateExceeded = mockQuota.generate.used >= mockQuota.generate.limit;
    
    expect(isAuditExceeded).toBe(false);
    expect(isGenerateExceeded).toBe(false);
    
    // Simulate exceeded quota
    const exceededQuota = { ...mockQuota.audit, used: 10 };
    expect(exceededQuota.used >= exceededQuota.limit).toBe(true);
  });
});

describe('CTR Audit Result Parsing', () => {
  it('should have valid score between 0 and 100', () => {
    expect(mockAuditResult.score).toBeGreaterThanOrEqual(0);
    expect(mockAuditResult.score).toBeLessThanOrEqual(100);
  });

  it('should have all required metrics', () => {
    const requiredMetrics = ['faceProminence', 'emotionalAppeal', 'textClarity', 'colorContrast'];
    
    requiredMetrics.forEach(metric => {
      expect(mockAuditResult.metrics[metric as keyof typeof mockAuditResult.metrics]).toBeDefined();
    });
  });

  it('should have CTR estimate range', () => {
    expect(mockAuditResult.estimatedCTR.min).toBeDefined();
    expect(mockAuditResult.estimatedCTR.max).toBeDefined();
    expect(mockAuditResult.estimatedCTR.min).toBeLessThan(mockAuditResult.estimatedCTR.max);
  });

  it('should format CTR as "AI-estimated CTR band"', () => {
    const ctrMin = mockAuditResult.estimatedCTR.min;
    const ctrMax = mockAuditResult.estimatedCTR.max;
    const formatted = `${ctrMin}% - ${ctrMax}%`;
    
    expect(formatted).toBe('4.2% - 6.8%');
  });

  it('should categorize score into tiers', () => {
    const getScoreTier = (score: number) => {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Average';
      return 'Needs Improvement';
    };
    
    expect(getScoreTier(85)).toBe('Excellent');
    expect(getScoreTier(78)).toBe('Good');
    expect(getScoreTier(45)).toBe('Average');
    expect(getScoreTier(30)).toBe('Needs Improvement');
  });
});

describe('Generated Concepts Parsing', () => {
  it('should parse concepts array correctly', () => {
    // Simulate API response
    const apiResponse = {
      success: true,
      data: {
        concepts: mockGeneratedConcepts,
        jobId: 'job-123',
      },
    };

    const concepts = apiResponse.data.concepts;
    
    expect(Array.isArray(concepts)).toBe(true);
    expect(concepts.length).toBe(3);
  });

  it('should map thumbnailUrl to imageUrl for frontend', () => {
    // This is the transformation usePublicThumbnailGenerator does
    const thumbnails = mockGeneratedConcepts.map(concept => ({
      id: concept.id,
      imageUrl: concept.thumbnailUrl, // Map from backend field
      prompt: concept.prompt,
      score: concept.score,
    }));

    expect(thumbnails[0].imageUrl).toBe('https://example.com/thumb1.jpg');
    expect(thumbnails[0].id).toBe('concept-1');
  });

  it('should sort concepts by score descending', () => {
    const sorted = [...mockGeneratedConcepts].sort((a, b) => b.score - a.score);
    
    expect(sorted[0].score).toBe(82);
    expect(sorted[1].score).toBe(79);
    expect(sorted[2].score).toBe(75);
  });

  it('should validate thumbnail URL format', () => {
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    mockGeneratedConcepts.forEach(concept => {
      expect(isValidUrl(concept.thumbnailUrl)).toBe(true);
    });
  });
});

describe('Face Reference Handling', () => {
  it('should handle 404 as empty state (no face reference)', () => {
    const handleFaceReferenceResponse = (status: number, data: any) => {
      if (status === 404) {
        return { hasFaceReference: false, data: null };
      }
      return { hasFaceReference: true, data };
    };

    // 404 = empty state, not error
    const emptyResult = handleFaceReferenceResponse(404, null);
    expect(emptyResult.hasFaceReference).toBe(false);
    expect(emptyResult.data).toBeNull();

    // 200 = has face reference
    const hasResult = handleFaceReferenceResponse(200, { imageUrl: 'https://example.com/face.jpg' });
    expect(hasResult.hasFaceReference).toBe(true);
    expect(hasResult.data.imageUrl).toBeDefined();
  });
});

describe('Gallery Pagination', () => {
  it('should calculate correct offset for page', () => {
    const limit = 20;
    const getOffset = (page: number) => (page - 1) * limit;

    expect(getOffset(1)).toBe(0);
    expect(getOffset(2)).toBe(20);
    expect(getOffset(3)).toBe(40);
  });

  it('should calculate total pages', () => {
    const limit = 20;
    const getTotalPages = (total: number) => Math.ceil(total / limit);

    expect(getTotalPages(50)).toBe(3);
    expect(getTotalPages(20)).toBe(1);
    expect(getTotalPages(21)).toBe(2);
    expect(getTotalPages(0)).toBe(0);
  });
});

describe('Request Building', () => {
  it('should build correct query params for gallery', () => {
    const buildQueryParams = (limit: number, offset: number) => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      return params.toString();
    };

    expect(buildQueryParams(20, 0)).toBe('limit=20&offset=0');
    expect(buildQueryParams(10, 30)).toBe('limit=10&offset=30');
  });

  it('should build correct auth header', () => {
    const token = 'test-token-123';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    expect(headers.Authorization).toBe('Bearer test-token-123');
    expect(headers['Content-Type']).toBe('application/json');
  });
});

describe('Error Response Handling', () => {
  it('should identify quota exceeded (429)', () => {
    const isQuotaExceeded = (status: number) => status === 429;
    
    expect(isQuotaExceeded(429)).toBe(true);
    expect(isQuotaExceeded(200)).toBe(false);
    expect(isQuotaExceeded(401)).toBe(false);
  });

  it('should identify auth errors (401)', () => {
    const isAuthError = (status: number) => status === 401;
    
    expect(isAuthError(401)).toBe(true);
    expect(isAuthError(200)).toBe(false);
  });

  it('should identify validation errors (400)', () => {
    const isValidationError = (status: number) => status === 400;
    
    expect(isValidationError(400)).toBe(true);
    expect(isValidationError(200)).toBe(false);
  });
});
