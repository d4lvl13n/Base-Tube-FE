import React from 'react';
import { render } from '@testing-library/react';
import { EngagementAnalyticsTab } from '../tabs/EngagementAnalyticsTab';

const noErrors = {
  viewMetrics: null,
  detailedViewMetrics: null,
  channelWatchPatterns: null,
  demographics: null,
  socialMetrics: null,
  growthMetrics: null,
  allTimeWatchHours: null,
  periodWatchHours: null,
  engagementTrends: null,
  topLikedContent: null,
  topSharedContent: null,
  topComments: null
} as Record<string, Error | null>;

const mockAnalytics: any = {
  channelWatchPatterns: {
    hourlyPatterns: [],
    weekdayPatterns: [],
    durationStats: { averageWatchDuration: 0, maxWatchDuration: 0, totalViews: 0, uniqueViewers: 0 },
    retentionByDuration: [
      { durationCategory: 'short', retentionRate: 40, viewCount: 10 }
    ],
    topRetainedVideos: []
  },
  engagementTrends: {
    likeGrowth: [
      { date: '2026-08-23', count: 3 },
      { date: '2026-08-24', count: 5 }
    ],
    commentGrowth: [{ date: '2026-08-24', count: 2 }],
    shareGrowth: []
  },
  topLikedContent: [],
  topSharedContent: [],
  topComments: [],
  isLoading: false,
  errors: { ...noErrors }
};

jest.mock('../../../../../hooks/useAnalyticsData', () => ({
  useCreatorAnalytics: () => mockAnalytics
}));

jest.mock('../../../../../api/video', () => ({
  getVideoById: jest.fn().mockResolvedValue({ thumbnail_url: null })
}));

beforeEach(() => {
  mockAnalytics.errors = { ...noErrors };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
});

describe('EngagementAnalyticsTab overview cards', () => {
  it('sums each series over the window', () => {
    const { container } = render(<EngagementAnalyticsTab channelId="1" />);
    expect(container.textContent).toContain('Total Likes8');
    expect(container.textContent).toContain('Comments2');
    // 40% over one bucket carrying all 10 views.
    expect(container.textContent).toContain('40.0%');
  });

  it('surfaces a watch-patterns failure on the watch-depth card only', () => {
    // The four cards used to be one block gated on engagementTrends, so a
    // channelWatchPatterns failure rendered as a healthy-looking percentage.
    mockAnalytics.errors = { ...noErrors, channelWatchPatterns: new Error('boom') };
    const { container } = render(<EngagementAnalyticsTab channelId="1" />);

    expect(container.textContent).toContain('Error loading watch depth');
    expect(container.textContent).not.toContain('Error loading likes');
    // the healthy cards still show their numbers
    expect(container.textContent).toContain('Total Likes8');
  });

  it('surfaces an engagement failure on the three engagement cards only', () => {
    mockAnalytics.errors = { ...noErrors, engagementTrends: new Error('boom') };
    const { container } = render(<EngagementAnalyticsTab channelId="1" />);

    expect(container.textContent).toContain('Error loading likes');
    expect(container.textContent).toContain('Error loading comments');
    expect(container.textContent).toContain('Error loading shares');
    // and the watch-depth card, which does not read that query, still renders
    expect(container.textContent).not.toContain('Error loading watch depth');
    expect(container.textContent).toContain('40.0%');
  });
});
