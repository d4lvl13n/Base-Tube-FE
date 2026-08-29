import React from 'react';
import { render } from '@testing-library/react';
import CreatorDashboard from '../CreatorDashboard';

const mockAnalytics: any = {
  growthMetrics: {
    metrics: {
      subscribers: { total: 0, trend: 0, data: [] },
      views: { total: 0, trend: 0, data: [] },
      engagement: { total: 0, trend: 0, data: [] }
    }
  },
  creatorWatchHours: { total: 0, formattedHours: '0 hours', periodTotal: 12, trend: 0 },
  viewMetrics: { totalViews: 0, uniqueViewers: 0, completedViews: 0, averageWatchDuration: 0 },
  detailedViewMetrics: undefined,
  socialMetrics: {
    interactions: {
      commentsReceived: 0,
      responseRate: 0,
      averageResponseTime: 0,
      recentEngagement: { total: 42, likes: 30, comments: 12 }
    },
    community: { subscriberCount: 0, recentSubscribers: 0 }
  },
  isLoading: false
};

jest.mock('../../../../hooks/useAnalyticsData', () => ({
  useCreatorAnalytics: () => mockAnalytics
}));

jest.mock('../../../../hooks/useChannelData', () => ({
  useChannelData: () => ({ channel: { subscribers_count: 3 }, isLoading: false })
}));

beforeEach(() => {
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

describe('CreatorDashboard', () => {
  it('never renders Infinity% or NaN% when the channel has no counted views', () => {
    // 42 interactions / 0 views used to render "Infinity%".
    const { container } = render(
      <CreatorDashboard
        channels={[]}
        userProfile={{ username: 'dami' }}
        clerkUser={null}
        selectedChannelId="1"
      />
    );

    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('NaN');
    expect(container.textContent).toContain('—');
  });

  it('does not render the watch-time hours count as a percentage badge', () => {
    // creatorWatchHours.periodTotal is 12 HOURS; it used to be passed to
    // StatsCard's `change` and rendered as "↑ 12%".
    const { container } = render(
      <CreatorDashboard
        channels={[]}
        userProfile={{ username: 'dami' }}
        clerkUser={null}
        selectedChannelId="1"
      />
    );

    expect(container.textContent).not.toMatch(/[↑↓]\s*12%/);
  });
});
