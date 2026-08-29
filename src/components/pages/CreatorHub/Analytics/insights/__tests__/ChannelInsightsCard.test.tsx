/**
 * Insights v3 card — the rendering contract.
 *
 * The point of these tests is PROVENANCE: a creator must be able to tell, without
 * reading the code, which lines were measured and which were guessed. So they assert the
 * one coverage sentence, the packaging read, the honest empty state, the low-confidence
 * chip, the distinct fallback styling and the regenerate budget — not the layout.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChannelInsightsCard } from '../ChannelInsightsCard';
import type { ChannelInsightsV3 } from '../../../../../../types/insights';

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

function insights(overrides: Partial<ChannelInsightsV3> = {}): ChannelInsightsV3 {
  return {
    schemaVersion: 3,
    channelId: 66,
    period: '7d',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dataMode: 'ok',
    coverage: { views: 47, videos: 12, watchSeconds: 7200, days: 7 },
    sample: { size: 12, of: 12 },
    facts: [{ text: '47 counted views in the last 7 days.', metric: 'views', value: 47, source: 'basetube' }],
    packaging: {
      positioning: 'A channel about software testing, aimed at working developers.',
      headline: 'Your titles name the tool and your thumbnails name nothing.',
      gaps: [
        { text: 'The walkthrough promises a build the image never shows.', videoIds: ['1'] }
      ],
      fixes: [
        {
          title: 'Put the promise on the image',
          detail: 'Carry the same short phrase across every thumbnail.',
          order: 1
        }
      ],
      perVideo: [
        {
          videoId: '1',
          note: 'The title carries the whole promise on its own.',
          videoTitle: 'A test video',
          thumbnailUrl: 'https://cdn.example/1.jpg'
        }
      ],
      nicheComparison: {
        theyDo: ['They lead with the outcome.'],
        youDo: ['You lead with the tool name.'],
        tryNext: ['Try naming the result first.']
      },
      reviewed: 1
    },
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

function prime(data: ChannelInsightsV3, refreshRemaining = 3) {
  mockGetChannelInsights.mockResolvedValue({
    status: 'ready',
    data,
    meta: { cached: false, refreshRemaining }
  });
}

beforeEach(() => mockGetChannelInsights.mockReset());

describe('one coverage sentence says what the report looked at', () => {
  it('names the videos and the views, and nothing else', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const strip = await screen.findByTestId('insights-coverage');
    expect(strip).toHaveTextContent('Based on 12 videos · 47 views this week');
    // The facts GRID is gone: the Overview tab owns the numbers, and restating them
    // here was half of why the tab read as a paraphrase of the analytics.
    expect(screen.queryByTestId('insights-facts')).not.toBeInTheDocument();
  });

  it('says "so far" rather than inventing a day count', async () => {
    prime(
      insights({
        period: 'all',
        coverage: { views: 47, videos: 12, watchSeconds: 30, days: null }
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="all" />));

    expect(await screen.findByTestId('insights-coverage')).toHaveTextContent('so far');
  });
});

describe('the packaging read is the page', () => {
  it('leads with the headline, then the positioning, the fixes and the named gaps', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const read = await screen.findByTestId('insights-read');
    expect(read).toHaveTextContent('Your titles name the tool');
    expect(read).toHaveTextContent('aimed at working developers');
    expect(screen.getByTestId('insights-fixes')).toHaveTextContent('Put the promise on the image');
    // A gap names real videos, and the card shows them.
    const gaps = screen.getByTestId('insights-gaps');
    expect(gaps).toHaveTextContent('The walkthrough promises a build');
    expect(gaps).toHaveTextContent('A test video');
    expect(screen.getByTestId('insights-pervideo')).toHaveTextContent(
      'The title carries the whole promise on its own.'
    );
  });
});

describe('data modes', () => {
  it('ok: the read, hypotheses and experiments, with no confidence chip', async () => {
    prime(insights());
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    expect(await screen.findByTestId('insights-read')).toBeInTheDocument();
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

    // ONE quiet line, not a checklist about our own thresholds — the packaging read
    // above already gave the creator something to do.
    expect(await screen.findByTestId('insights-insufficient')).toHaveTextContent(
      'Performance hypotheses appear once your videos have been watched a few dozen times.'
    );
    expect(screen.getByTestId('insights-read')).toBeInTheDocument();
    expect(screen.getByTestId('insights-fixes')).toBeInTheDocument();
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
      'AI unavailable — showing what we could produce.'
    );
    // The packaging read survived the hypotheses leg failing, and the niche panel shows
    // CONVENTIONS — never the peers' median view count.
    expect(screen.getByTestId('insights-read')).toBeInTheDocument();
    expect(screen.getByTestId('insights-niche')).not.toHaveTextContent('15,000');
    expect(screen.queryByTestId('insights-hypotheses')).not.toBeInTheDocument();
  });
});

describe('the niche panel compares conventions, never medians', () => {
  it('renders they-do / you-do / try-next and the fixed disclaimer', async () => {
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
          disclaimer: 'YouTube peers found by your topics — a reference, not a target.'
        }
      })
    );
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    const niche = await screen.findByTestId('insights-niche');
    expect(niche).toHaveTextContent('Your niche on YouTube');
    expect(niche).toHaveTextContent('a reference, not a target');
    expect(niche).toHaveTextContent('They lead with the outcome.');
    expect(niche).toHaveTextContent('You lead with the tool name.');
    expect(niche).toHaveTextContent('Try naming the result first.');
    // A median view count about strangers, printed beside a creator with 47 views, is
    // the comparison the disclaimer spends a sentence forbidding.
    expect(niche).not.toHaveTextContent('15,000');
    expect(niche).not.toHaveTextContent('Median');
  });
});

describe('missing pieces are named, not silently omitted', () => {
  it('states why there is no niche reference', async () => {
    prime(
      insights({
        nicheReference: undefined,
        nicheUnavailable: { reason: 'Only 2 comparable videos were found — too few to publish a median.' },
        packaging: { ...insights().packaging!, nicheComparison: undefined },
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
    prime(insights({ packaging: undefined, partial: ['packaging'] }));
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

describe('a regeneration that loses the race keeps waiting', () => {
  it('shows the old report AND says a new one is coming, rather than looking finished', async () => {
    const original = insights({ generatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() });
    prime(original);
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    // The backend already holds a generation lock for this channel and period.
    mockGetChannelInsights.mockResolvedValueOnce({ status: 'generating', previous: original });
    fireEvent.click(screen.getByTestId('insights-regenerate'));

    // The regression: the old report used to come back as a normal result, so the card
    // looked settled and the button looked broken.
    expect(await screen.findByTestId('insights-generating')).toBeInTheDocument();
    expect(screen.getByTestId('insights-read')).toBeInTheDocument();
    expect(screen.getByTestId('insights-regenerate')).toBeDisabled();
  });

  it('polls until generatedAt actually moves, then settles', async () => {
    jest.useFakeTimers();
    try {
      const original = insights({ generatedAt: '2026-08-29T09:00:00.000Z' });
      const replacement = insights({ generatedAt: '2026-08-29T10:00:00.000Z' });
      prime(original);
      render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

      await screen.findByTestId('insights-coverage');

      mockGetChannelInsights.mockResolvedValueOnce({ status: 'generating', previous: original });
      fireEvent.click(screen.getByTestId('insights-regenerate'));
      await screen.findByTestId('insights-generating');

      // Still polling: the stamp on screen is the one we are waiting to see replaced.
      const callsBefore = mockGetChannelInsights.mock.calls.length;
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(mockGetChannelInsights.mock.calls.length).toBeGreaterThan(callsBefore);

      // The winner finishes; the next poll sees a different stamp and we settle.
      mockGetChannelInsights.mockResolvedValue({
        status: 'ready',
        data: replacement,
        meta: { cached: false, refreshRemaining: 2 }
      });
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() =>
        expect(screen.queryByTestId('insights-generating')).not.toBeInTheDocument()
      );
    } finally {
      jest.useRealTimers();
    }
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
    expect(button).toHaveTextContent('(3 left)');

    mockGetChannelInsights.mockResolvedValueOnce({
      status: 'ready',
      data: insights({ dataMode: 'ok' }),
      meta: { cached: false, refreshRemaining: 2 }
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mockGetChannelInsights).toHaveBeenLastCalledWith('66', '7d', { refresh: true })
    );
    await waitFor(() => expect(screen.getByTestId('insights-regenerate')).toHaveTextContent('(2 left)'));
  });

  it('is disabled once the daily budget is spent, rather than failing with a 429', async () => {
    prime(insights(), 0);
    render(wrapper(<ChannelInsightsCard channelId="66" period="7d" />));

    await screen.findByTestId('insights-coverage');
    const button = screen.getByTestId('insights-regenerate');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('(0 left)');
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
