import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { InsightsView } from '../CreatorHub/Analytics/insights/InsightsView';
import type { ChannelInsightsV2 } from '../../../types/insights';

/**
 * /dev/insights-preview — the Insights tab, without a backend or an account.
 *
 * The tab's layout has five states that only differ by DATA (`insufficient`,
 * `thin`, `ok`, `fallback`, `generating`), and four of them need a channel with
 * the wrong amount of traffic to reproduce. This route renders the pure
 * InsightsView against fixtures so the states can be looked at side by side.
 *
 *   /dev/insights-preview?mode=insufficient|thin|ok|fallback|generating
 *
 * It is registered in src/App.tsx ONLY when NODE_ENV === 'development', so it
 * ships nowhere. The fixtures live here rather than in a shared mock module
 * because nothing else should ever render them.
 */

/** Deterministic offline thumbnails — a preview should not need the network. */
const thumb = (label: string, background: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
       <rect width="320" height="180" fill="${background}"/>
       <text x="160" y="98" font-family="Inter,Arial,sans-serif" font-size="22"
             fill="#ffffff" text-anchor="middle">${label}</text>
     </svg>`
  )}`;

const OBSERVATIONS = [
  {
    videoId: '101',
    videoTitle: 'Building a Base app in one afternoon',
    thumbnailUrl: thumb('01', '#1f2937'),
    text: 'Title is 6 words, 41 characters.',
  },
  {
    videoId: '101',
    videoTitle: 'Building a Base app in one afternoon',
    thumbnailUrl: thumb('01', '#1f2937'),
    text: 'One face, centred, no text overlay.',
  },
  {
    videoId: '102',
    videoTitle: 'Why I stopped using centralised video hosting',
    thumbnailUrl: thumb('02', '#3f2a1d'),
    text: 'Title is 7 words, 45 characters.',
  },
  {
    videoId: '102',
    videoTitle: 'Why I stopped using centralised video hosting',
    thumbnailUrl: thumb('02', '#3f2a1d'),
    text: 'Four words of overlay text.',
  },
  {
    videoId: '103',
    videoTitle: 'Content passes explained in 4 minutes',
    thumbnailUrl: thumb('03', '#1e293b'),
    text: 'Title is 6 words, 37 characters.',
  },
  {
    videoId: '104',
    videoTitle: 'A week of uploading every single day',
    thumbnailUrl: thumb('04', '#2a1f3d'),
    text: 'No face; a screenshot fills the frame.',
  },
  {
    videoId: '105',
    videoTitle: 'The upload pipeline, end to end',
    thumbnailUrl: thumb('05', '#13343b'),
    text: 'Title is 6 words, 31 characters.',
  },
];

const NICHE = {
  query: 'base blockchain tutorial',
  peerCount: 20,
  window: 'this_year',
  medianViewsPerVideo: 15234,
  medianUploadsPerWeek: 1.5,
  medianTitleLength: 52,
  commonPatterns: [
    '12 of 20 titles contain a year',
    '9 of 20 titles open with "How to"',
    '14 of 20 thumbnails show a face',
  ],
  disclaimer:
    'YouTube peers found by your topics. Different platform and audience — a reference, not a target.',
};

function base(): ChannelInsightsV2 {
  return {
    schemaVersion: 2,
    channelId: 66,
    period: '7d',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dataMode: 'ok',
    coverage: { views: 1204, videos: 12, watchSeconds: 42300, days: 7 },
    sample: { size: 12, of: 12 },
    // Wording copied from buildFacts() in base-be (src/services/insights/
    // insightsData.ts), including its two sentence shapes — a preview that
    // invents friendlier facts would flatter a layout that has to render the
    // real ones.
    facts: [
      {
        text: '1,204 counted views in the last 7 days.',
        metric: 'views',
        value: 1204,
        unit: 'views',
        source: 'basetube',
      },
      {
        text: '11.8 hours of watch time in the last 7 days.',
        metric: 'watch_hours',
        value: 11.8,
        unit: 'hours',
        source: 'basetube',
      },
      {
        text: '12 videos in the catalogue.',
        metric: 'videos_total',
        value: 12,
        unit: 'videos',
        source: 'basetube',
      },
      {
        text: '9 of 12 videos were watched at least once in the last 7 days.',
        metric: 'videos_with_views',
        value: 9,
        unit: 'videos',
        source: 'basetube',
      },
      {
        text: 'Average share of a video actually watched: 54% (weighted by views).',
        metric: 'avg_percent_watched',
        value: 54,
        unit: 'percent',
        source: 'basetube',
      },
      {
        text: 'Median views among watched videos: 86.',
        metric: 'median_views_per_watched_video',
        value: 86,
        unit: 'views',
        source: 'basetube',
      },
      {
        text: 'Upload cadence: 1.5 videos per week.',
        metric: 'uploads_per_week',
        value: 1.5,
        unit: 'per_week',
        source: 'basetube',
      },
      {
        text: 'Median title length: 41 characters.',
        metric: 'median_title_length',
        value: 41,
        unit: 'characters',
        source: 'basetube',
      },
    ],
    observations: OBSERVATIONS,
    hypotheses: [
      {
        text: 'The two videos with a single centred face hold attention longer than the screenshot thumbnails — the packaging may be doing the work, not the topic.',
        basedOn: ['views', 'avg_percent_watched'],
      },
      {
        text: 'Shorter titles appear alongside the higher completion rates; it may be that the promise is easier to read at a glance.',
        basedOn: ['median_title_length', 'avg_percent_watched'],
      },
    ],
    experiments: [
      {
        title: 'One subject per thumbnail',
        variantBrief:
          'Rebuild the thumbnail for your next upload with a single centred face and no overlay text.',
        method: 'Publish, then compare views per impression against the previous three uploads after two weeks.',
        priority: 1,
      },
      {
        title: 'Cut titles to six words',
        variantBrief: 'Write the next three titles at six words or fewer, keeping the same promise.',
        method: 'Compare average percent watched across the three against your current 54%.',
        priority: 2,
      },
    ],
    nicheReference: NICHE,
  };
}

const FIXTURES: Record<string, { insights?: ChannelInsightsV2; isGenerating?: boolean }> = {
  ok: { insights: base() },
  thin: {
    insights: {
      ...base(),
      dataMode: 'thin',
      coverage: { views: 47, videos: 12, watchSeconds: 2100, days: 7 },
      sample: { size: 8, of: 12 },
      facts: [
        {
          text: '47 counted views in the last 7 days.',
          metric: 'views',
          value: 47,
          unit: 'views',
          source: 'basetube',
        },
        {
          text: '2,100 seconds of watch time in the last 7 days.',
          metric: 'watch_seconds',
          value: 2100,
          unit: 'seconds',
          source: 'basetube',
        },
        {
          text: '12 videos in the catalogue.',
          metric: 'videos_total',
          value: 12,
          unit: 'videos',
          source: 'basetube',
        },
        {
          text: '5 of 12 videos were watched at least once in the last 7 days.',
          metric: 'videos_with_views',
          value: 5,
          unit: 'videos',
          source: 'basetube',
        },
        {
          text: 'Median title length: 41 characters.',
          metric: 'median_title_length',
          value: 41,
          unit: 'characters',
          source: 'basetube',
        },
        {
          text: '28 subscribers.',
          metric: 'subscribers',
          value: 28,
          unit: 'count',
          source: 'basetube',
        },
      ],
      observations: OBSERVATIONS.slice(0, 5),
      hypotheses: base().hypotheses.slice(0, 1),
      experiments: base().experiments.slice(0, 1),
    },
  },
  insufficient: {
    insights: {
      ...base(),
      dataMode: 'insufficient',
      coverage: { views: 2, videos: 8, watchSeconds: 96, days: 7 },
      sample: { size: 8, of: 8 },
      facts: [
        {
          text: '2 counted views in the last 7 days.',
          metric: 'views',
          value: 2,
          unit: 'views',
          source: 'basetube',
        },
        {
          text: '96 seconds of watch time in the last 7 days.',
          metric: 'watch_seconds',
          value: 96,
          unit: 'seconds',
          source: 'basetube',
        },
        {
          text: '8 videos in the catalogue.',
          metric: 'videos_total',
          value: 8,
          unit: 'videos',
          source: 'basetube',
        },
        {
          text: '2 of 8 videos were watched at least once in the last 7 days.',
          metric: 'videos_with_views',
          value: 2,
          unit: 'videos',
          source: 'basetube',
        },
        {
          text: 'Median title length: 44 characters.',
          metric: 'median_title_length',
          value: 44,
          unit: 'characters',
          source: 'basetube',
        },
        {
          text: '3 subscribers.',
          metric: 'subscribers',
          value: 3,
          unit: 'count',
          source: 'basetube',
        },
      ],
      observations: OBSERVATIONS.slice(0, 4),
      hypotheses: [],
      experiments: [],
      nicheReference: undefined,
      nicheUnavailable: {
        reason: 'only 2 comparable videos were found, too few to publish a median.',
      },
      partial: ['nicheReference'],
    },
  },
  fallback: {
    insights: {
      ...base(),
      hypotheses: [],
      experiments: [],
      observations: [],
      partial: ['observations'],
      fallback: { reason: 'The AI analysis could not be generated for this report.' },
    },
  },
  generating: { isGenerating: true },
};

export const InsightsPreview: React.FC = () => {
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'ok';
  const fixture = FIXTURES[mode] ?? FIXTURES.ok;

  return (
    <div className="min-h-screen bg-black px-6 py-10">
      <p className="mx-auto mb-6 w-full max-w-6xl text-xs text-gray-600">
        dev preview · mode={mode} · ok | thin | insufficient | fallback | generating
      </p>
      <InsightsView
        insights={fixture.insights}
        channelName="Base Builders"
        period="7d"
        onPeriodChange={() => undefined}
        isGenerating={fixture.isGenerating}
        refreshRemaining={2}
        regenerate={() => undefined}
      />
    </div>
  );
};

export default InsightsPreview;
