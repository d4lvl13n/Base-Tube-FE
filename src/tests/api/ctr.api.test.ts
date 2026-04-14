import {
  formatQuotaLimit,
  getScoreColor,
  getScoreLabel,
  isValidYouTubeUrl,
} from '../../api/ctr';
import {
  AuditResponse,
  CTRUsageAccess,
  CTRGenerationResponse,
  CTRQuotaStatus,
  YouTubeAuditResponse,
} from '../../types/ctr';
import {
  normalizeUsageAccessResponse,
  updateCTRUsageFromOperation,
} from '../../utils/usageAccess';

const mockQuotaStatus: CTRQuotaStatus = {
  audit: {
    used: 3,
    limit: 10,
    remaining: 7,
    resetsAt: '2026-04-14T00:00:00.000Z',
  },
  generate: {
    used: 2,
    limit: 20,
    remaining: 18,
    resetsAt: '2026-04-14T00:00:00.000Z',
  },
  tier: 'free',
  isAnonymous: false,
  limits: {
    audit: { anonymous: 3, free: 10, pro: 100, enterprise: -1 },
    generate: { anonymous: 1, free: 20, pro: 100, enterprise: -1 },
  },
};

const mockAuditResponse: AuditResponse = {
  success: true,
  data: {
    auditId: 42,
    quotaInfo: {
      used: 4,
      limit: 10,
      remaining: 6,
      resetsAt: '2026-04-14T00:00:00.000Z',
    },
    audit: {
      overallScore: 8.4,
      confidence: 'high',
      heuristics: {
        mobileReadability: 8.5,
        colorContrast: 7.9,
        facePresence: true,
        faceEmotion: 'surprised',
        compositionScore: 8.2,
        textOverlay: true,
        brightness: 7.4,
        colorfulness: 8.1,
      },
      strengths: ['Readable on mobile', 'Strong contrast'],
      weaknesses: ['Text could be larger'],
      suggestions: ['Increase text size'],
      detectedNiche: 'technology',
      estimatedCTR: {
        low: 4.1,
        mid: 5.2,
        high: 6.3,
      },
    },
  },
};

const mockYouTubeAuditResponse: YouTubeAuditResponse = {
  success: true,
  data: {
    ...mockAuditResponse.data,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    videoMetadata: {
      title: 'How I Doubled CTR',
      description: 'A breakdown of high-performing thumbnails.',
      channelTitle: 'BaseTube',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      viewCount: 12345,
    },
  },
};

const mockGenerationResponse: CTRGenerationResponse = {
  success: true,
  data: {
    detectedNiche: 'technology',
    generationTime: 18234,
    quotaInfo: {
      used: 3,
      limit: 20,
      remaining: 17,
      resetsAt: '2026-04-14T00:00:00.000Z',
    },
    concepts: [
      {
        id: 'concept-1',
        thumbnailUrl: 'https://example.com/generated-1.jpg',
        thumbnailPath: '/generated/1.jpg',
        prompt: 'Bold tech thumbnail with expressive face',
        conceptName: 'Shock and Awe',
        conceptDescription: 'High-contrast reaction thumbnail',
        estimatedCTRScore: 8.8,
      },
      {
        id: 'concept-2',
        thumbnailUrl: 'https://example.com/generated-2.jpg',
        thumbnailPath: '/generated/2.jpg',
        prompt: 'Clean split-screen with product and creator',
        conceptName: 'Before / After',
        conceptDescription: 'Transformation-focused thumbnail',
        estimatedCTRScore: 8.1,
      },
    ],
  },
};

const mockCreditAccessResponse = {
  success: true,
  data: {
    mode: 'credits',
    creditInfo: {
      balance: 120,
      reserved: 15,
      available: 105,
    },
    pricing: {
      thumbnail: {
        generatePerImage: 4,
        editPerImage: 6,
        variationPerImage: 3,
      },
      ctr: {
        audit: 2,
        auditWithPersonas: 5,
        generatePerConcept: 8,
      },
    },
  },
};

describe('CTR API contract fixtures', () => {
  it('matches the current quota shape', () => {
    expect(mockQuotaStatus.audit.remaining).toBe(7);
    expect(mockQuotaStatus.generate.remaining).toBe(18);
    expect(mockQuotaStatus.audit.resetsAt).toContain('T00:00:00.000Z');
    expect(mockQuotaStatus.limits.generate.free).toBe(20);
  });

  it('matches the current audit response shape', () => {
    expect(mockAuditResponse.data.audit.overallScore).toBeGreaterThan(0);
    expect(mockAuditResponse.data.audit.heuristics.mobileReadability).toBeGreaterThan(0);
    expect(mockAuditResponse.data.auditId).toBe(42);
    expect(mockAuditResponse.data.quotaInfo?.remaining).toBe(6);
  });

  it('matches the YouTube audit response shape', () => {
    expect(mockYouTubeAuditResponse.data.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    expect(mockYouTubeAuditResponse.data.videoMetadata.title).toBe('How I Doubled CTR');
    expect(mockYouTubeAuditResponse.data.audit.detectedNiche).toBe('technology');
  });

  it('matches the current generation response shape', () => {
    expect(mockGenerationResponse.data.concepts).toHaveLength(2);
    expect(mockGenerationResponse.data.concepts[0].thumbnailUrl).toContain('generated-1');
    expect(mockGenerationResponse.data.detectedNiche).toBe('technology');
    expect(mockGenerationResponse.data.quotaInfo?.remaining).toBe(17);
  });

  it('normalizes legacy quota and new credit access responses', () => {
    const quotaAccess = normalizeUsageAccessResponse({
      success: true,
      data: mockQuotaStatus,
    }) as CTRUsageAccess;
    const creditAccess = normalizeUsageAccessResponse(mockCreditAccessResponse) as CTRUsageAccess;

    expect(quotaAccess.mode).toBe('quota');
    expect(quotaAccess.mode === 'quota' && quotaAccess.quota.generate.remaining).toBe(18);

    expect(creditAccess.mode).toBe('credits');
    expect(creditAccess.mode === 'credits' && creditAccess.creditInfo.available).toBe(105);
    expect(creditAccess.mode === 'credits' && creditAccess.pricing?.ctr.generatePerConcept).toBe(8);
  });

  it('updates CTR access state from operation payloads', () => {
    const current = normalizeUsageAccessResponse({
      success: true,
      data: mockQuotaStatus,
    }) as CTRUsageAccess;

    const updatedQuota = updateCTRUsageFromOperation(current, mockGenerationResponse.data, 'generate');
    expect(updatedQuota?.mode).toBe('quota');
    expect(updatedQuota?.mode === 'quota' && updatedQuota.quota.generate.remaining).toBe(17);

    const updatedCredits = updateCTRUsageFromOperation(current, {
      creditInfo: mockCreditAccessResponse.data.creditInfo,
      pricing: mockCreditAccessResponse.data.pricing,
    }, 'generate');
    expect(updatedCredits?.mode).toBe('credits');
    expect(updatedCredits?.mode === 'credits' && updatedCredits.creditInfo.available).toBe(105);
  });
});

describe('CTR API utilities', () => {
  it('validates supported YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(isValidYouTubeUrl('https://youtu.be/abc123')).toBe(true);
    expect(isValidYouTubeUrl('https://www.youtube.com/shorts/abc123')).toBe(true);
    expect(isValidYouTubeUrl('https://vimeo.com/123')).toBe(false);
  });

  it('maps score color and labels using current thresholds', () => {
    expect(getScoreColor(8.5)).toBe('green');
    expect(getScoreColor(6.5)).toBe('yellow');
    expect(getScoreColor(4.5)).toBe('orange');
    expect(getScoreColor(2.5)).toBe('red');

    expect(getScoreLabel(9.2)).toBe('Exceptional');
    expect(getScoreLabel(8.1)).toBe('Excellent');
    expect(getScoreLabel(7.2)).toBe('Good');
    expect(getScoreLabel(6.2)).toBe('Above Average');
    expect(getScoreLabel(5.2)).toBe('Average');
    expect(getScoreLabel(4.2)).toBe('Below Average');
    expect(getScoreLabel(3.2)).toBe('Needs Improvement');
    expect(getScoreLabel(2.9)).toBe('Poor');
  });

  it('formats unlimited quota distinctly', () => {
    expect(formatQuotaLimit(-1)).toBe('∞');
    expect(formatQuotaLimit(20)).toBe('20');
  });
});
