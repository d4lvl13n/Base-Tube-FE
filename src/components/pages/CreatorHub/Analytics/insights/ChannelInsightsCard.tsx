import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  Lightbulb,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useChannelInsights } from '../../../../../hooks/useAnalyticsData';
import type {
  ChannelInsightsV2,
  InsightsPeriod,
  InsightsNicheReference
} from '../../../../../types/insights';

/*
 * The Insights card group, at the top of the Overview tab.
 *
 * It replaces the AI Insights TAB, which had been hidden because the copy it rendered
 * was invented (see docs/ANALYTICS_REVIEW_2026-08-29.md finding 9). Everything here is
 * built to make the provenance of each line legible at a glance:
 *
 *  - the coverage strip states what the report was computed from, first thing;
 *  - FACTS are measured, so they carry no hedging and no AI framing;
 *  - OBSERVATIONS describe our own thumbnails and titles and nothing else;
 *  - HYPOTHESES are visibly guesses, and carry a "low confidence" chip when the
 *    backend judged the sample thin;
 *  - a FALLBACK renders as a muted "AI unavailable" strip above measured data that is
 *    still perfectly good — never as an apology that hides the numbers;
 *  - `insufficient` gets an honest empty state rather than a spinner or filler.
 */

const CARD =
  'rounded-xl bg-black/40 border border-gray-800/40 backdrop-blur-sm';
const SECTION_TITLE =
  'text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2';

function formatWatch(seconds: number): string {
  if (seconds >= 3600) return `${Math.round((seconds / 3600) * 10) / 10} h watched`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} min watched`;
  return `${Math.round(seconds)} s watched`;
}

/** "Based on 47 views · 12 videos · 3 min watched · 7 days" */
const CoverageStrip: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  const { coverage } = insights;
  const parts = [
    `${coverage.views.toLocaleString()} views`,
    `${coverage.videos.toLocaleString()} videos`,
    formatWatch(coverage.watchSeconds),
    coverage.days === null ? 'all time' : `${coverage.days} days`
  ];
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-400" data-testid="insights-coverage">
        Based on {parts.join(' · ')}
      </p>
      {/* The facts above cover the whole catalogue; the AI sections reasoned over a
          subset. Saying which is the difference between a sample and a silent lie. */}
      {insights.sample.size < insights.sample.of && (
        <p className="text-xs text-gray-500" data-testid="insights-sample">
          AI sections reviewed your {insights.sample.size} most-viewed videos of{' '}
          {insights.sample.of}. The measured numbers cover all {insights.sample.of}.
        </p>
      )}
    </div>
  );
};

const Facts: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.facts.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="insights-facts">
      <h4 className={SECTION_TITLE}>Measured</h4>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {insights.facts.map((fact) => (
          <li
            key={fact.metric}
            className="text-sm text-gray-200 bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2"
          >
            {fact.text}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Observations: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.observations.length === 0) return null;

  // Group by video so a thumbnail is shown once with everything recorded about it.
  type ObservedVideo = { title: string; thumbnailUrl: string | null; lines: string[] };
  const byVideo = new Map<string, ObservedVideo>();
  insights.observations.forEach((observation, index) => {
    const key = observation.videoId ?? `channel-${index}`;
    const existing = byVideo.get(key);
    if (existing) existing.lines.push(observation.text);
    else
      byVideo.set(key, {
        title: observation.videoTitle ?? 'Your channel',
        thumbnailUrl: observation.thumbnailUrl ?? null,
        lines: [observation.text]
      });
  });

  return (
    <section className="space-y-3" data-testid="insights-observations">
      <h4 className={SECTION_TITLE}>
        <ImageIcon className="w-3.5 h-3.5" />
        What your packaging looks like
      </h4>
      <p className="text-xs text-gray-500">
        Recorded from your thumbnails and titles alone — no view counts were shown to this step.
      </p>
      <ul className="space-y-3">
        {Array.from(byVideo.entries()).map(([key, video]) => (
          <li key={key} className="flex gap-3">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt=""
                className="w-24 h-14 object-cover rounded-md border border-gray-800/50 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-14 rounded-md bg-gray-900/60 border border-gray-800/50 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-gray-200 truncate">{video.title}</p>
              <ul className="mt-1 space-y-0.5">
                {video.lines.map((line) => (
                  <li key={line} className="text-xs text-gray-400">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

const Hypotheses: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.hypotheses.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="insights-hypotheses">
      <h4 className={SECTION_TITLE}>
        <Lightbulb className="w-3.5 h-3.5" />
        Worth testing
      </h4>
      <ul className="space-y-2">
        {insights.hypotheses.map((hypothesis) => (
          <li
            key={hypothesis.text}
            className="text-sm text-gray-300 bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2"
          >
            {insights.dataMode === 'thin' && (
              <span
                className="mr-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                data-testid="insights-low-confidence"
              >
                low confidence
              </span>
            )}
            {hypothesis.text}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Experiments: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.experiments.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="insights-experiments">
      <h4 className={SECTION_TITLE}>
        <FlaskConical className="w-3.5 h-3.5" />
        Experiments to run
      </h4>
      <ol className="space-y-2">
        {insights.experiments.map((experiment) => (
          <li
            key={`${experiment.priority}-${experiment.title}`}
            className="bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2"
          >
            <p className="text-sm text-gray-200">
              <span className="text-[#fa7517] mr-2">{experiment.priority}.</span>
              {experiment.title}
            </p>
            {experiment.variantBrief && (
              <p className="text-xs text-gray-400 mt-1">{experiment.variantBrief}</p>
            )}
            {experiment.method && (
              <p className="text-xs text-gray-500 mt-1">How: {experiment.method}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

const NicheReference: React.FC<{ reference: InsightsNicheReference }> = ({ reference }) => (
  <section className="space-y-2" data-testid="insights-niche">
    <h4 className={SECTION_TITLE}>
      <Globe className="w-3.5 h-3.5" />
      YouTube reference
    </h4>
    <div className="bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2 space-y-1">
      <p className="text-xs text-gray-500">
        {reference.peerCount} YouTube videos found by searching “{reference.query}”.
      </p>
      <ul className="text-sm text-gray-300 space-y-0.5">
        <li>Median views per video: {reference.medianViewsPerVideo.toLocaleString()}</li>
        {/* Null means we could not measure it from this sample — the row is omitted
            rather than printed as 0, which would read as "these creators never upload". */}
        {reference.medianUploadsPerWeek !== null && (
          <li>Median uploads per week: {reference.medianUploadsPerWeek}</li>
        )}
        <li>Median title length: {reference.medianTitleLength} characters</li>
      </ul>
      {reference.commonPatterns.length > 0 && (
        <ul className="text-xs text-gray-400 list-disc list-inside pt-1">
          {reference.commonPatterns.map((pattern) => (
            <li key={pattern}>{pattern}</li>
          ))}
        </ul>
      )}
      <p className="text-xs text-amber-400/80 pt-1">{reference.disclaimer}</p>
    </div>
  </section>
);

/** No peers, and the reason why. A stated reason is not a missing section. */
const NicheUnavailable: React.FC<{ reason: string }> = ({ reason }) => (
  <section className="space-y-2" data-testid="insights-niche-unavailable">
    <h4 className={SECTION_TITLE}>
      <Globe className="w-3.5 h-3.5" />
      YouTube reference
    </h4>
    <p className="text-sm text-gray-500 bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2">
      No comparison published — {reason}
    </p>
  </section>
);

/** One leg failed while the rest succeeded. Name it; do not just omit the section. */
const PartialNotice: React.FC<{ legs: ChannelInsightsV2['partial'] }> = ({ legs }) => {
  if (!legs || legs.length === 0) return null;
  const labels: Record<string, string> = {
    observations: 'packaging review',
    nicheReference: 'YouTube comparison'
  };
  const named = legs.map((leg) => labels[leg] || leg).join(' and ');
  return (
    <p className="text-xs text-gray-500" data-testid="insights-partial">
      The {named} could not be produced for this report.
    </p>
  );
};

/** The honest empty state: what we CAN say, and plainly why we stop there. */
const InsufficientNotice: React.FC = () => (
  <div
    className="text-sm text-gray-300 bg-black/30 border border-gray-800/40 rounded-lg px-3 py-2"
    data-testid="insights-insufficient"
  >
    Not enough views yet for hypotheses — here&apos;s what we can say.
  </div>
);

/** A failed model call is stated, not disguised. The measured data below is intact. */
const FallbackNotice: React.FC<{ reason: string }> = ({ reason }) => (
  <div
    className="flex items-start gap-2 text-sm text-gray-400 bg-gray-900/40 border border-gray-800/50 rounded-lg px-3 py-2"
    data-testid="insights-fallback"
  >
    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
    <span>
      AI unavailable — showing measured data only.
      <span className="block text-xs text-gray-500">{reason}</span>
    </span>
  </div>
);

/**
 * Turn a failed regeneration into something a creator can act on.
 *
 * The backend's 429 body already says which budget ran out and it is the only place
 * that knows; axios's default ("Request failed with status code 429") says nothing. The
 * generic client retry is disabled for this request precisely so this message survives
 * to be shown — see `isInsightsRegeneration` in src/api/index.ts.
 */
function regenerationMessage(error: Error): string {
  const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
  const fromBackend = response?.data?.message;
  if (fromBackend) return fromBackend;
  if (response?.status === 429) {
    return 'Regeneration limit reached for today. Your last report is still shown above.';
  }
  return error.message || 'Could not regenerate insights.';
}

export const ChannelInsightsCard: React.FC<{
  channelId: string;
  period: InsightsPeriod;
}> = ({ channelId, period }) => {
  const [open, setOpen] = useState(true);
  const {
    insights,
    meta,
    isGenerating,
    isLoading,
    error,
    regenerate,
    isRegenerating,
    regenerateError
  } = useChannelInsights(channelId, period);

  const remaining = meta?.refreshRemaining ?? 0;

  return (
    <div className={`${CARD} p-4 md:p-6`} data-testid="insights-card">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
        >
          <Sparkles className="w-4 h-4 text-[#fa7517]" />
          <span className="text-lg font-semibold text-gray-100">Insights</span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        <div className="flex items-center gap-3">
          {insights && (
            <span className="text-xs text-gray-500" data-testid="insights-generated-at">
              Generated {formatDistanceToNow(new Date(insights.generatedAt), { addSuffix: true })}
            </span>
          )}
          <button
            type="button"
            onClick={() => regenerate()}
            // The daily budget is real money. Disabling the button when it is spent is
            // more honest than letting the click fail with a 429.
            disabled={isRegenerating || isLoading || remaining <= 0}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-800/60 text-gray-300 hover:text-white hover:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="insights-regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
            <span className="text-gray-500">({remaining} left today)</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-5">
          {isLoading && <p className="text-sm text-gray-500">Reading your analytics…</p>}

          {/* Someone else's request is already paying for this exact report. */}
          {!isLoading && isGenerating && (
            <p className="text-sm text-gray-500" data-testid="insights-generating">
              Generating your insights — this usually takes under a minute.
            </p>
          )}

          {!isLoading && error && (
            <p className="text-sm text-gray-400" data-testid="insights-error">
              Insights are unavailable right now.
            </p>
          )}

          {regenerateError && (
            <p className="text-sm text-amber-400/80" data-testid="insights-regenerate-error">
              {regenerationMessage(regenerateError)}
            </p>
          )}

          {insights && (
            <>
              <CoverageStrip insights={insights} />
              {insights.fallback && <FallbackNotice reason={insights.fallback.reason} />}
              <PartialNotice legs={insights.partial} />
              {insights.dataMode === 'insufficient' && <InsufficientNotice />}
              <Facts insights={insights} />
              <Observations insights={insights} />
              <Hypotheses insights={insights} />
              <Experiments insights={insights} />
              {insights.nicheReference && <NicheReference reference={insights.nicheReference} />}
              {!insights.nicheReference && insights.nicheUnavailable && (
                <NicheUnavailable reason={insights.nicheUnavailable.reason} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelInsightsCard;
