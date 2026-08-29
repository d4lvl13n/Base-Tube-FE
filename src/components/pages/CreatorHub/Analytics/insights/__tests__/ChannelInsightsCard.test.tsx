/**
 * Insights v2 card — the rendering contract.
 *
 * The point of these tests is PROVENANCE: a creator must be able to tell, without
 * reading the code, which lines were measured and which were guessed. So they assert
 * the coverage strip, the honest empty state, the low-confidence chip, the distinct
 * fallback styling and the regenerate budget — not the layout.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChannelInsightsCard } from '../ChannelInsightsCard';
import type { ChannelInsightsV2 } from '../../../../../../types/insights';

const mockGetChannelInsights = jest.fn();

jest.mock('../../../../../../api/analytics', () => ({
  getChannelInsights: (...args: unknown[]) => mockGetChannelInsights(...args)
}));

// The hook itself is exercised in src/hooks/__tests__/useAnalyticsData.test.tsx; here
// we drive the component through it with a real QueryClient.
function wrapper(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function insights(overrides: Partial<ChannelInsightsV2> = {}): ChannelInsightsV2 {
  return {
    schemaVersion: 2,
    channelId: 66,
    period: '7d',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dataMode: 'ok',
    coverage: { views: 47, videos: 12, watchSeconds: 7200, days: 7 },
    sample: { size: 12, of: 12 },
    facts: [{ text: '47 counted views in the last 7 days.', metric: 'views', value: 47, source: 'basetube' }],
    observations: [
      {
        videoId: '1',
        text: 'Title is 4 words.',
        videoTitle: 'A test video',
        thumbnailUrl: 'https://cdn.example/1.jpg'
      }
    ],
    hypotheses: [{ text: 'The shared layout may aid recognition.', basedOn: ['views'] }],
    experiments: [
      {
        title: 'Try one subject per thumbnail',
        variantBrief: 'Build a thumbnail with a single subject.',
        method: 'Publish both and compare after a month.',
        priority: 1
      }
    ],
    ...overrides
  };
}

function prime(data: ChannelInsightsV2, refreshRemaining = 3) {
  mockGetChannelInsights.mockResolvedValue({
    status: 'ready',
    data,
    meta: { cached: false, refreshRemaining }
  });
}

beforeEach(() => mockGetChannelInsights.mockReset());

describe('the coverage strip states what the report was computed from', () => {
  it('names views, videos, watch time and the window', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const strip = await screen.findByTestId('insights-coverage');
    expect(strip).toHaveTextContent('47 views');
    expect(strip).toHaveTextContent('12 videos');
    expect(strip).toHaveTextContent('2 h watched');
    expect(strip).toHaveTextContent('7 days');
  });

  it('says "all time" rather than inventing a day count', async () => {
    prime(
      insights({
        period: 'all',
        coverage: { views: 47, videos: 12, watchSeconds: 30, days: null }
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="all" />));

    expect(await screen.findByTestId('insights-coverage')).toHaveTextContent('all time');
  });
});

describe('data modes', () => {
  it('ok: facts, observations, hypotheses and experiments, with no confidence chip', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-facts')).toHaveTextContent('47 counted views');
    expect(screen.getByTestId('insights-observations')).toHaveTextContent('Title is 4 words.');
    expect(screen.getByTestId('insights-hypotheses')).toHaveTextContent('may aid recognition');
    expect(screen.getByTestId('insights-experiments')).toHaveTextContent('Try one subject per thumbnail');
    expect(screen.queryByTestId('insights-low-confidence')).not.toBeInTheDocument();
    expect(screen.queryByTestId('insights-insufficient')).not.toBeInTheDocument();
  });

  it('thin: every hypothesis carries a low-confidence chip', async () => {
    prime(insights({ dataMode: 'thin' }));
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-low-confidence')).toBeInTheDocument();
  });

  it('insufficient: says so plainly and still shows what we can say', async () => {
    prime(
      insights({
        dataMode: 'insufficient',
        coverage: { views: 2, videos: 12, watchSeconds: 40, days: 7 },
        hypotheses: [],
        experiments: [],
        facts: [{ text: '2 counted views in the last 7 days.', metric: 'views', value: 2, source: 'basetube' }]
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-insufficient')).toHaveTextContent(
      "Not enough views yet for hypotheses — here's what we can say."
    );
    expect(screen.getByTestId('insights-facts')).toHaveTextContent('2 counted views');
    expect(screen.getByTestId('insights-observations')).toBeInTheDocument();
    expect(screen.queryByTestId('insights-hypotheses')).not.toBeInTheDocument();
    expect(screen.queryByTestId('insights-experiments')).not.toBeInTheDocument();
  });

  it('fallback: an explicit "AI unavailable" strip above intact measured data', async () => {
    prime(
      insights({
        hypotheses: [],
        experiments: [],
        fallback: { reason: 'The AI analysis could not be generated for this report.' },
        nicheReference: {
          query: 'unit testing',
          peerCount: 20,
          window: 'this_year',
          medianViewsPerVideo: 15000,
          medianUploadsPerWeek: null,
          medianTitleLength: 52,
          commonPatterns: [],
          disclaimer: 'YouTube peers found by your topics.'
        }
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-fallback')).toHaveTextContent(
      'AI unavailable — showing measured data only.'
    );
    expect(screen.getByTestId('insights-facts')).toBeInTheDocument();
    expect(screen.getByTestId('insights-niche')).toHaveTextContent('15,000');
    expect(screen.queryByTestId('insights-hypotheses')).not.toBeInTheDocument();
  });
});

describe('the niche reference is labelled as YouTube, never as a target', () => {
  it('renders the disclaimer and omits an unmeasurable cadence', async () => {
    prime(
      insights({
        nicheReference: {
          query: 'unit testing typescript',
          peerCount: 20,
          window: 'this_year',
          medianViewsPerVideo: 15000,
          medianUploadsPerWeek: null,
          medianTitleLength: 52,
          commonPatterns: ['12 of 20 titles contain a year'],
          disclaimer:
            'YouTube peers found by your topics. Different platform and audience — a reference, not a target.'
        }
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const niche = await screen.findByTestId('insights-niche');
    expect(niche).toHaveTextContent('YouTube reference');
    expect(niche).toHaveTextContent('a reference, not a target');
    expect(niche).toHaveTextContent('12 of 20 titles contain a year');
    expect(niche).not.toHaveTextContent('Median uploads per week');
  });
});

describe('a sample is labelled as a sample', () => {
  it('says the AI sections saw fewer videos than the facts cover', async () => {
    prime(insights({ sample: { size: 40, of: 100 }, coverage: { views: 900, videos: 100, watchSeconds: 60, days: 7 } }));
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const note = await screen.findByTestId('insights-sample');
    expect(note).toHaveTextContent('40 most-viewed videos of 100');
    expect(note).toHaveTextContent('measured numbers cover all 100');
  });

  it('says nothing when the model saw everything', async () => {
    prime(insights({ sample: { size: 12, of: 12 } }));
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    expect(screen.queryByTestId('insights-sample')).not.toBeInTheDocument();
  });
});

describe('missing pieces are named, not silently omitted', () => {
  it('states why there is no niche reference', async () => {
    prime(
      insights({
        nicheReference: undefined,
        nicheUnavailable: { reason: 'Only 2 comparable videos were found — too few to publish a median.' },
        partial: ['nicheReference']
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-niche-unavailable')).toHaveTextContent(
      'Only 2 comparable videos were found'
    );
    expect(screen.getByTestId('insights-partial')).toHaveTextContent('YouTube comparison');
  });

  it('names a failed packaging review', async () => {
    prime(insights({ observations: [], partial: ['observations'] }));
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-partial')).toHaveTextContent('packaging review');
  });
});

describe('generating', () => {
  it('says the report is on its way rather than showing an error', async () => {
    mockGetChannelInsights.mockResolvedValue({ status: 'generating' });
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-generating')).toHaveTextContent(
      'Generating your insights'
    );
    expect(screen.queryByTestId('insights-error')).not.toBeInTheDocument();
  });
});

describe('regenerate', () => {
  it('shows the remaining budget and spends one on click', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    // Wait for the first load: until it lands there is no meta, so the budget shown
    // is the conservative zero and the button is correctly disabled.
    await screen.findByTestId('insights-coverage');
    const button = screen.getByTestId('insights-regenerate');
    expect(button).toHaveTextContent('(3 left today)');

    mockGetChannelInsights.mockResolvedValueOnce({
      status: 'ready',
      data: insights({ dataMode: 'ok' }),
      meta: { cached: false, refreshRemaining: 2 }
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mockGetChannelInsights).toHaveBeenLastCalledWith('66', '7d', { refresh: true })
    );
    await waitFor(() => expect(screen.getByTestId('insights-regenerate')).toHaveTextContent('(2 left today)'));
  });

  it('is disabled once the daily budget is spent, rather than failing with a 429', async () => {
    prime(insights(), 0);
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    const button = screen.getByTestId('insights-regenerate');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('(0 left today)');
  });

  it('surfaces the limit message when the backend refuses', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    const button = screen.getByTestId('insights-regenerate');
    // Shaped like a real axios error: the useful sentence is in the response BODY, not
    // in `error.message` ("Request failed with status code 429").
    const rejection = Object.assign(new Error('Request failed with status code 429'), {
      response: {
        status: 429,
        data: { success: false, message: 'Regeneration limit reached (3 per day).' }
      }
    });
    mockGetChannelInsights.mockRejectedValueOnce(rejection);
    fireEvent.click(button);

    expect(await screen.findByTestId('insights-regenerate-error')).toHaveTextContent(
      'Regeneration limit reached (3 per day).'
    );
  });

  it('falls back to a plain limit message when the backend sent no body', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    mockGetChannelInsights.mockRejectedValueOnce(
      Object.assign(new Error('Request failed with status code 429'), { response: { status: 429 } })
    );
    fireEvent.click(screen.getByTestId('insights-regenerate'));

    expect(await screen.findByTestId('insights-regenerate-error')).toHaveTextContent(
      'Regeneration limit reached for today.'
    );
  });
});

describe('failure and freshness', () => {
  it('states that insights are unavailable instead of rendering an empty card', async () => {
    mockGetChannelInsights.mockRejectedValue(new Error('boom'));
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-error')).toHaveTextContent('Insights are unavailable right now.');
  });

  it('stamps how old the report is', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-generated-at')).toHaveTextContent('about 2 hours ago');
  });
});
