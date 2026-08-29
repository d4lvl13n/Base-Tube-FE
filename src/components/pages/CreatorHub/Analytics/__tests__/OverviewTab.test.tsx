import React from 'react';
import { render } from '@testing-library/react';
import { OverviewTab } from '../tabs/OverviewTab';

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
  growthMetrics: {
    metrics: {
      subscribers: { total: 4, trend: 0, data: [] },
      views: { total: 0, trend: 0, data: [] },
      engagement: { total: 0, trend: 0, data: [] }
    }
  },
  detailedViewMetrics: {
    totalViews: 100,
    uniqueViewers: 1,
    completedViews: 0,
    averageWatchDuration: 0,
    viewsByPeriod: { last24h: 0, last7d: 40, last30d: 100 }
  },
  creatorWatchHours: { total: 1, formattedHours: '1 hours', periodTotal: 1, trend: 0 },
  channelWatchPatterns: {
    hourlyPatterns: [],
    weekdayPatterns: [],
    durationStats: { averageWatchDuration: 0, maxWatchDuration: 0, totalViews: 0, uniqueViewers: 0 },
    retentionByDuration: [],
    topRetainedVideos: []
  },
  engagementTrends: {
    likeGrowth: [
      { date: '2026-08-23', count: 3 },
      { date: '2026-08-24', count: 5 }
    ],
    commentGrowth: [
      { date: '2026-08-23', count: 1 },
      { date: '2026-08-24', count: 1 }
    ],
    shareGrowth: []
  },
  isLoading: false,
  errors: { ...noErrors }
};

jest.mock('../../../../../hooks/useAnalyticsData', () => ({
  useCreatorAnalytics: () => mockAnalytics
}));

jest.mock('../../../../../hooks/useChannelData', () => ({
  useChannelData: () => ({ channel: { subscribers_count: 4 }, isLoading: false })
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

describe('OverviewTab', () => {
  it('sums the engagement series over the window instead of reading the last day', () => {
    const { container } = render(<OverviewTab channelId="1" />);
    // likes 3 + 5 = 8, comments 1 + 1 = 2 => 10 interactions over 40 views.
    // Reading the last data point (the old getLatestCount) would give 5 and 1.
    expect(container.textContent).toContain('Likes8');
    expect(container.textContent).toContain('Comments2');
    expect(container.textContent).toContain('10 likes + comments / 40 views');
    // (8 + 2) / 40 = 25%, a real ratio rather than the raw count with a '%'.
    expect(container.textContent).toContain('25.0%');
  });

  it('shows an interaction-rate error when its OWN inputs fail, not growthMetrics', () => {
    // The card reads engagementTrends + detailedViewMetrics. It used to be
    // gated on growthMetrics, so a failure of either input rendered as a number.
    mockAnalytics.errors = { ...noErrors, engagementTrends: new Error('boom') };
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).toContain('Error loading interactions');
  });

  it('shows an interaction-rate error when the views query fails', () => {
    mockAnalytics.errors = { ...noErrors, detailedViewMetrics: new Error('boom') };
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).toContain('Error loading interactions');
    expect(container.textContent).toContain('Error loading views');
  });

  it('does not blame the interaction card for a growth-metrics failure', () => {
    mockAnalytics.errors = { ...noErrors, growthMetrics: new Error('boom') };
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).toContain('Error loading subscribers');
    expect(container.textContent).not.toContain('Error loading interactions');
  });

  it('never renders Infinity% or NaN%', () => {
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('NaN');
  });
});
