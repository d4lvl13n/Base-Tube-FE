import React from 'react';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OverviewTab } from '../tabs/OverviewTab';

// The tab links to Business ("Pass sales"), so it needs a router.
const render = (ui: React.ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

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
      subscribers: { total: 4, trend: null, previousTotal: 0, windowDays: 7, data: [] },
      views: { total: 19, trend: null, previousTotal: 0, windowDays: 7, data: [] },
      engagement: { total: 25, trend: null, previousTotal: 0, windowDays: 7, data: [] }
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
  loading: Object.fromEntries(Object.keys(noErrors).map(key => [key, false])),
  errors: { ...noErrors }
};

jest.mock('../../../../../hooks/useAnalyticsData', () => ({
  useCreatorAnalytics: () => mockAnalytics,
  // The Insights card sits at the top of this tab now. It has its own suite
  // (insights/__tests__/ChannelInsightsCard.test.tsx); here it must simply not
  // reach the network, so it renders its loading line and stays out of the way.
  useChannelInsights: () => ({
    insights: undefined,
    meta: undefined,
    isLoading: true,
    error: null,
    refetch: jest.fn(),
    regenerate: jest.fn(),
    isRegenerating: false,
    regenerateError: null
  })
}));

const mockChannel: { channel: unknown; isLoading: boolean; error: Error | null } = {
  channel: { subscribers_count: 4 },
  isLoading: false,
  error: null
};

jest.mock('../../../../../hooks/useChannelData', () => ({
  useChannelData: () => mockChannel
}));

const selectPeriod = (value: string) =>
  fireEvent.change(screen.getByRole('combobox'), { target: { value } });

beforeEach(() => {
  mockAnalytics.errors = { ...noErrors };
  mockAnalytics.isLoading = false;
  mockAnalytics.loading = Object.fromEntries(Object.keys(noErrors).map(key => [key, false]));
  mockChannel.error = null;
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
    // likes 3 + 5 = 8, comments 1 + 1 = 2. Reading the last data point (the
    // old getLatestCount) would give 5 and 1.
    expect(container.textContent).toContain('Likes8');
    expect(container.textContent).toContain('Comments2');
  });

  it('shows the two counts and no rate below 100 views (25 on 19 is not "131.6%")', () => {
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).toContain('Too few views for a rate');
    expect(container.textContent).toContain('25 likes + comments · 19 views, the last 7 days');
    expect(container.textContent).not.toContain('131.6%');
  });

  it('shows the real rate from 100 views, from the same growth window as the Views card', () => {
    mockAnalytics.growthMetrics.metrics.views.total = 400;
    mockAnalytics.growthMetrics.metrics.engagement.total = 100;
    try {
      const { container } = render(<OverviewTab channelId="1" />);
      expect(container.textContent).toContain('25.0%');
      expect(container.textContent).toContain('Views400');
    } finally {
      mockAnalytics.growthMetrics.metrics.views.total = 19;
      mockAnalytics.growthMetrics.metrics.engagement.total = 25;
    }
  });

  it('blames the growth response for the interaction and views cards, and nothing else', () => {
    mockAnalytics.errors = { ...noErrors, growthMetrics: new Error('boom') };
    const view = render(<OverviewTab channelId="1" />);
    expect(view.container.textContent).toContain('Error loading interactions');
    expect(view.container.textContent).toContain('Error loading views');
    view.unmount();

    mockAnalytics.errors = { ...noErrors, engagementTrends: new Error('boom'), detailedViewMetrics: new Error('boom') };
    const utils = render(<OverviewTab channelId="1" />);
    expect(utils.container.textContent).not.toContain('Error loading interactions');
    expect(utils.container.textContent).not.toContain('Error loading views');
  });

  it('never renders Infinity% or NaN%', () => {
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('NaN');
  });

  it('blames growthMetrics for the subscriber card at 7d, and the channel record at all-time', () => {
    // 7d: the card's value is growthMetrics' "new in period".
    mockAnalytics.errors = { ...noErrors, growthMetrics: new Error('boom') };
    const view = render(<OverviewTab channelId="1" />);
    expect(view.container.textContent).toContain('Error loading subscribers');
    view.unmount();

    // 7d with only the channel record failing: that query is not read here.
    mockAnalytics.errors = { ...noErrors };
    mockChannel.error = new Error('boom');
    const utils = render(<OverviewTab channelId="1" />);
    expect(utils.container.textContent).not.toContain('Error loading subscribers');

    // All time: the value comes from the channel record, so now it must show.
    selectPeriod('all');
    expect(utils.container.textContent).toContain('Error loading subscribers');
  });
});

  it('renders ready metrics while an unrelated query remains pending', () => {
    mockAnalytics.isLoading = true;
    mockAnalytics.loading.demographics = true;
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).toContain('Likes8');
    expect(container.textContent).toContain('Comments2');
  });

  it('keeps only the dependent metric loading', () => {
    mockAnalytics.isLoading = true;
    mockAnalytics.loading.engagementTrends = true;
    const { container } = render(<OverviewTab channelId="1" />);
    expect(container.textContent).not.toContain('Likes8');
    expect(container.textContent).toContain('Avg. % watched');
  });
