import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  Lightbulb,
  RefreshCw,
  Ruler,
} from 'lucide-react';
import { Select } from '../../../../ui/Select';
import type {
  ChannelInsightsV2,
  InsightsNicheReference,
  InsightsPeriod,
} from '../../../../../types/insights';
import {
  INSUFFICIENT_VIEWS_THRESHOLD,
  NICHE_MIN_PEERS,
  THIN_VIEWS_THRESHOLD,
} from '../../../../../types/insights';
import {
  basedOnLabels,
  factLabel,
  factValue,
  headlineSentence,
  windowLabel,
} from './format';

/*
 * The Insights tab, as a page rather than a stack of sections.
 *
 * WHAT THE LAYOUT IS FOR. The v2 contract is honest but it reads like a report:
 * coverage, facts, observations, hypotheses, experiments, niche, notices. This
 * view keeps every one of those distinctions — a creator must still be able to
 * tell measured from guessed without reading the code — and gives each its own
 * card, so the honesty is legible instead of exhausting:
 *
 *  - the HEADER greets the channel and states the coverage in one sentence, so
 *    the first thing on screen is what the report was computed from;
 *  - FACTS are a stat grid, because they are numbers;
 *  - OBSERVATIONS sit under the thumbnails they describe, because they are
 *    about pictures;
 *  - HYPOTHESES are numbered and carry "based on", because they are guesses
 *    with a stated basis, and the low-confidence chip stays in `thin` mode;
 *  - the NICHE reference and the unlock checklist live in a side column, since
 *    neither is about this channel's own performance;
 *  - `insufficient` is NOT an empty state. It renders everything measurable and
 *    adds the checklist that says what more data will unlock.
 *
 * This component is PURE: it is given a report and renders it. The network,
 * polling and regeneration budget live in ChannelInsightsCard; the dev preview
 * route at /dev/insights-preview renders this view straight from fixtures.
 */

const PANEL = 'rounded-xl border border-gray-800/60 bg-[#0f0f0f]';
const CARD = `${PANEL} p-5`;
const TITLE = 'flex items-center gap-2 text-sm font-medium text-gray-200';
const ICON = 'h-4 w-4 shrink-0 text-gray-500';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

/** A card that arrives instead of appearing. 150 ms, and nothing at all under motion-reduce. */
const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  testId?: string;
}> = ({ children, className, delay = 0, testId }) => {
  const reduced = useReducedMotion();
  return (
    <motion.section
      data-testid={testId}
      className={className ?? CARD}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

/* ---------------------------------------------------------------- header -- */

const Header: React.FC<{
  channelName?: string;
  insights?: ChannelInsightsV2;
  period: InsightsPeriod;
  onPeriodChange?: (period: InsightsPeriod) => void;
  regenerate?: () => void;
  isRegenerating?: boolean;
  canRegenerate: boolean;
  refreshRemaining: number;
}> = ({
  channelName,
  insights,
  period,
  onPeriodChange,
  regenerate,
  isRegenerating,
  canRegenerate,
  refreshRemaining,
}) => (
  // GRID, not `flex-col lg:flex-row`: OnchainKit's stylesheet is imported after
  // Tailwind's in src/index.tsx and ships its own unprefixed `.flex-col`, which
  // beats `.lg\:flex-row` on document order (a media query adds no specificity).
  // Grid columns have no such twin, so this one stays a row on large screens.
  <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Insights{channelName ? ` for ${channelName}` : ''}
      </h1>
      {insights ? (
        <>
          {/* The coverage numbers ARE the sentence — the greeting is the wrapper,
              never a replacement for saying what this was computed from. */}
          <p className="mt-1 max-w-2xl text-sm text-gray-400" data-testid="insights-coverage">
            {headlineSentence(insights)}
          </p>
          {insights.sample.size < insights.sample.of && (
            <p className="mt-1 text-xs text-gray-500" data-testid="insights-sample">
              AI sections reviewed your {insights.sample.size} most-viewed videos of{' '}
              {insights.sample.of}. The measured numbers cover all {insights.sample.of}.
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-sm text-gray-500">What the data supports, and only that.</p>
      )}
    </div>

    <div className="flex flex-col gap-2 lg:items-end lg:justify-self-end">
      {onPeriodChange && (
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as InsightsPeriod)}
          options={PERIOD_OPTIONS}
        />
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {insights && (
          <span data-testid="insights-generated-at">
            Updated {formatDistanceToNow(new Date(insights.generatedAt), { addSuffix: true })}
          </span>
        )}
        {insights && regenerate && <span aria-hidden="true" className="text-gray-700">·</span>}
        {regenerate && (
          <button
            type="button"
            onClick={() => regenerate()}
            // The daily budget is real money. Disabling the button when it is spent
            // is more honest than letting the click fail with a 429.
            disabled={!canRegenerate}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400
                        transition-colors hover:bg-white/5 hover:text-white
                        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
                        ${FOCUS}`}
            data-testid="insights-regenerate"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Regenerate
            <span className="text-gray-600">({refreshRemaining} left today)</span>
          </button>
        )}
      </div>
    </div>
  </header>
);

/* ----------------------------------------------------------------- facts -- */

const Facts: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.facts.length === 0) return null;
  return (
    <Panel delay={0.02} testId="insights-facts">
      <h2 className={TITLE}>
        <Ruler className={ICON} aria-hidden="true" />
        What we measured
      </h2>
      {/* A tile shows the figure and names it; the measured SENTENCE is carried
          verbatim in the tooltip and for screen readers, so nothing the backend
          wrote is paraphrased away. */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
        {insights.facts.map((fact) => (
          <p key={fact.metric} className="min-w-0" title={fact.text}>
            <span aria-hidden="true" className="block text-xl font-semibold tabular-nums text-white">
              {factValue(fact)}
            </span>
            <span aria-hidden="true" className="mt-0.5 block text-xs leading-snug text-gray-500">
              {factLabel(fact)}
            </span>
            <span className="sr-only">{fact.text}</span>
          </p>
        ))}
      </div>
    </Panel>
  );
};

/* ---------------------------------------------------------- observations -- */

type ObservedVideo = { title: string; thumbnailUrl: string | null; lines: string[] };

function groupObservations(insights: ChannelInsightsV2): [string, ObservedVideo][] {
  const byVideo = new Map<string, ObservedVideo>();
  insights.observations.forEach((observation, index) => {
    const key = observation.videoId ?? `channel-${index}`;
    const existing = byVideo.get(key);
    if (existing) existing.lines.push(observation.text);
    else
      byVideo.set(key, {
        title: observation.videoTitle ?? 'Your channel',
        thumbnailUrl: observation.thumbnailUrl ?? null,
        lines: [observation.text],
      });
  });
  return Array.from(byVideo.entries());
}

const Packaging: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  const videos = groupObservations(insights);
  const failed = insights.partial?.includes('observations') ?? false;
  if (videos.length === 0 && !failed) return null;

  return (
    <Panel delay={0.04} testId="insights-observations">
      <h2 className={TITLE}>
        <ImageIcon className={ICON} aria-hidden="true" />
        Your thumbnails and titles
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Recorded from the pictures and words alone — no view counts were shown to this step.
      </p>

      {failed && (
        <p className="mt-3 text-xs text-gray-500" data-testid="insights-partial">
          The packaging review could not be produced for this report.
        </p>
      )}

      {videos.length > 0 && (
        <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {videos.map(([key, video]) => (
            <li key={key} className="w-40 shrink-0">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="aspect-video w-full rounded-md border border-gray-800/60 bg-gray-900 object-cover"
                />
              ) : (
                <div className="aspect-video w-full rounded-md border border-gray-800/60 bg-gray-900" />
              )}
              <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-gray-300">
                {video.title}
              </p>
              <ul className="mt-1.5 space-y-1">
                {video.lines.map((line) => (
                  <li key={line} className="text-[11px] leading-snug text-gray-500">
                    {line}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

/* ------------------------------------------------------------ hypotheses -- */

const Hypotheses: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.hypotheses.length === 0) return null;
  return (
    <Panel delay={0.06} testId="insights-hypotheses">
      <h2 className={TITLE}>
        <Lightbulb className={ICON} aria-hidden="true" />
        Hypotheses
      </h2>
      <p className="mt-1 text-xs text-gray-500">Guesses, not findings — each one is worth a test.</p>
      <ol className="mt-4 space-y-3">
        {insights.hypotheses.map((hypothesis, index) => {
          const basis = basedOnLabels(hypothesis.basedOn);
          return (
            <li
              key={hypothesis.text}
              className="flex gap-3 rounded-lg border border-gray-800/60 bg-black/20 p-3"
            >
              <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-gray-600">
                {index + 1}
              </span>
              <div className="min-w-0">
                {insights.dataMode === 'thin' && (
                  <span
                    className="mr-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase
                               tracking-wide text-amber-400/90"
                    data-testid="insights-low-confidence"
                  >
                    low confidence
                  </span>
                )}
                <span className="text-sm leading-relaxed text-gray-300">{hypothesis.text}</span>
                {basis.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-gray-600">based on: {basis.join(', ')}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
};

/* ------------------------------------------------------------------ what -- */

/** The hypotheses slot when the sample cannot carry one. Not a shrug — a reason. */
const InsufficientNotice: React.FC = () => (
  <Panel delay={0.06}>
    <h2 className={TITLE}>
      <Lightbulb className={ICON} aria-hidden="true" />
      Hypotheses
    </h2>
    <p className="mt-2 text-sm text-gray-400" data-testid="insights-insufficient">
      Not enough views yet for hypotheses — here&apos;s what we can say.
    </p>
  </Panel>
);

/* ----------------------------------------------------------- experiments -- */

const Experiments: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  if (insights.experiments.length === 0) return null;
  return (
    <Panel delay={0.08} testId="insights-experiments">
      <h2 className={TITLE}>
        <FlaskConical className={ICON} aria-hidden="true" />
        Experiments to try
      </h2>
      <ul className="mt-4 space-y-3">
        {insights.experiments.map((experiment) => (
          <li
            key={`${experiment.priority}-${experiment.title}`}
            className="rounded-lg border border-gray-800/60 bg-black/20 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-200">{experiment.title}</p>
              {/* An ORDER, never an impact label: P1 is the one to run first. */}
              <span
                className="shrink-0 rounded border border-[#fa7517]/30 px-1.5 py-0.5 text-[10px]
                           font-medium text-[#fa7517]"
              >
                P{experiment.priority}
              </span>
            </div>
            {experiment.variantBrief && (
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                {experiment.variantBrief}
              </p>
            )}
            {experiment.method && (
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                <span className="text-gray-600">How to measure: </span>
                {experiment.method}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
};

/* ----------------------------------------------------------------- niche -- */

const NicheStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-gray-800/50 py-2">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm tabular-nums text-gray-200">{value}</span>
  </div>
);

const NicheHeading: React.FC = () => (
  <h2 className={TITLE}>
    <Globe className={ICON} aria-hidden="true" />
    Your niche on YouTube
  </h2>
);

const Niche: React.FC<{ reference: InsightsNicheReference }> = ({ reference }) => (
  <Panel delay={0.04} testId="insights-niche">
    <NicheHeading />
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-gray-800/70 bg-black/40 px-2.5 py-1 text-xs text-gray-300">
        {reference.query}
      </span>
      <span className="text-xs text-gray-500">
        {reference.peerCount} peers · {windowLabel(reference.window)}
      </span>
    </div>

    <div className="mt-3">
      <NicheStat
        label="Median views per video"
        value={reference.medianViewsPerVideo.toLocaleString()}
      />
      {/* Null means we could not measure it from this sample — the row is omitted
          rather than printed as 0, which would read as "these creators never upload". */}
      {reference.medianUploadsPerWeek !== null && (
        <NicheStat label="Median uploads per week" value={`${reference.medianUploadsPerWeek}`} />
      )}
      <NicheStat label="Median title length" value={`${reference.medianTitleLength} chars`} />
    </div>

    {reference.commonPatterns.length > 0 && (
      <ul className="mt-3 space-y-1.5">
        {reference.commonPatterns.map((pattern) => (
          <li key={pattern} className="flex gap-2 text-xs leading-snug text-gray-400">
            <span aria-hidden="true" className="text-gray-700">
              —
            </span>
            {pattern}
          </li>
        ))}
      </ul>
    )}

    <p className="mt-4 border-t border-gray-800/50 pt-3 text-xs leading-snug text-gray-500">
      {reference.disclaimer}
    </p>
  </Panel>
);

/** No peers, and the reason why. A stated reason is not a missing section. */
const NicheUnavailable: React.FC<{ reason: string; failed: boolean }> = ({ reason, failed }) => (
  <Panel delay={0.04} testId="insights-niche-unavailable">
    <NicheHeading />
    <p className="mt-2 text-sm leading-relaxed text-gray-400">No comparison published — {reason}</p>
    {failed && (
      <p className="mt-2 text-xs text-gray-500" data-testid="insights-partial">
        The YouTube comparison could not be produced for this report.
      </p>
    )}
  </Panel>
);

/* --------------------------------------------------------------- unlocks -- */

type UnlockStep = { label: string; met: boolean; progress: string };

function unlockSteps(insights: ChannelInsightsV2): UnlockStep[] {
  const views = insights.coverage.views;
  const peers = insights.nicheReference?.peerCount ?? 0;
  return [
    {
      label: 'Hypotheses about what is working',
      met: views >= INSUFFICIENT_VIEWS_THRESHOLD,
      progress: `${views.toLocaleString()} / ${INSUFFICIENT_VIEWS_THRESHOLD} views`,
    },
    {
      label: 'Readings we no longer hedge',
      met: views >= THIN_VIEWS_THRESHOLD,
      progress: `${views.toLocaleString()} / ${THIN_VIEWS_THRESHOLD} views`,
    },
    {
      label: 'A YouTube niche reference',
      met: peers >= NICHE_MIN_PEERS,
      progress: `${peers} / ${NICHE_MIN_PEERS} peers found`,
    },
  ];
}

/**
 * What more data buys.
 *
 * The thresholds are the ones the backend actually branches on, imported from
 * the shared contract — a checklist that promised something the code does not
 * do would be worse than no checklist. It disappears once everything is met.
 */
const Unlocks: React.FC<{ insights: ChannelInsightsV2 }> = ({ insights }) => {
  const steps = unlockSteps(insights);
  if (steps.every((step) => step.met)) return null;
  return (
    <Panel delay={0.06} testId="insights-unlocks">
      <h2 className={TITLE}>What unlocks more</h2>
      <ul className="mt-3 space-y-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-2.5">
            {step.met ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
            ) : (
              <span
                aria-hidden="true"
                className="mt-1 h-3 w-3 shrink-0 rounded-full border border-gray-700"
              />
            )}
            <div className="min-w-0">
              <p
                className={`text-sm leading-snug ${step.met ? 'text-gray-500' : 'text-gray-300'}`}
              >
                {step.label}
              </p>
              <p className="text-xs tabular-nums text-gray-600">{step.progress}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
};

/* --------------------------------------------------------------- notices -- */

/** A failed model call is stated, not disguised. The measured data below is intact. */
const FallbackNotice: React.FC<{ reason: string }> = ({ reason }) => (
  <div
    className="flex items-start gap-2.5 rounded-lg border border-gray-800/60 bg-[#0f0f0f] px-4 py-3"
    data-testid="insights-fallback"
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
    <p className="text-sm text-gray-300">
      AI unavailable — showing measured data only.
      <span className="mt-0.5 block text-xs text-gray-500">{reason}</span>
    </p>
  </div>
);

/** The layout, drawn empty. A shape that fills in beats a spinner on a blank page. */
const Skeleton: React.FC<{ line: string; testId?: string }> = ({ line, testId }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-500" data-testid={testId}>
      {line}
    </p>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-5">
        <div className={`${PANEL} h-40 animate-pulse bg-gray-900/40`} />
        <div className={`${PANEL} h-56 animate-pulse bg-gray-900/40`} />
      </div>
      <div className="space-y-5">
        <div className={`${PANEL} h-64 animate-pulse bg-gray-900/40`} />
      </div>
    </div>
  </div>
);

/**
 * Turn a failed regeneration into something a creator can act on.
 *
 * The backend's 429 body already says which budget ran out and it is the only
 * place that knows; axios's default ("Request failed with status code 429")
 * says nothing. The generic client retry is disabled for this request precisely
 * so this message survives to be shown — see `isInsightsRegeneration` in
 * src/api/index.ts.
 */
export function regenerationMessage(error: Error): string {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })
    .response;
  const fromBackend = response?.data?.message;
  if (fromBackend) return fromBackend;
  if (response?.status === 429) {
    return 'Regeneration limit reached for today. Your last report is still shown above.';
  }
  return error.message || 'Could not regenerate insights.';
}

/* ------------------------------------------------------------------ view -- */

export interface InsightsViewProps {
  insights?: ChannelInsightsV2;
  channelName?: string;
  period: InsightsPeriod;
  /** Omitted by the dev preview and by tests that drive the card directly. */
  onPeriodChange?: (period: InsightsPeriod) => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  error?: Error | null;
  regenerate?: () => void;
  isRegenerating?: boolean;
  regenerateError?: Error | null;
  refreshRemaining?: number;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  insights,
  channelName,
  period,
  onPeriodChange,
  isLoading = false,
  isGenerating = false,
  error,
  regenerate,
  isRegenerating = false,
  regenerateError,
  refreshRemaining = 0,
}) => {
  const nicheFailed = insights?.partial?.includes('nicheReference') ?? false;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" data-testid="insights-card">
      <Header
        channelName={channelName}
        insights={insights}
        period={period}
        onPeriodChange={onPeriodChange}
        regenerate={regenerate}
        isRegenerating={isRegenerating}
        canRegenerate={!isRegenerating && !isLoading && refreshRemaining > 0}
        refreshRemaining={refreshRemaining}
      />

      {regenerateError && (
        <p className="text-sm text-amber-400/90" data-testid="insights-regenerate-error">
          {regenerationMessage(regenerateError)}
        </p>
      )}

      {!isLoading && error && (
        <p className="text-sm text-gray-400" data-testid="insights-error">
          Insights are unavailable right now.
        </p>
      )}

      {/* A generation already in flight — ours, or somebody else's paying for the
          same report. With nothing on screen yet it gets the empty layout; with a
          previous report on screen it is one line above intact data. */}
      {isGenerating && insights && (
        <p className="text-sm text-gray-500" data-testid="insights-generating">
          Generating your insights — this usually takes under a minute.
        </p>
      )}
      {isGenerating && !insights && (
        <Skeleton
          testId="insights-generating"
          line="Generating your insights — this usually takes under a minute."
        />
      )}
      {isLoading && !isGenerating && <Skeleton line="Reading your analytics…" />}

      {insights && (
        <>
          {insights.fallback && <FallbackNotice reason={insights.fallback.reason} />}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-5">
              <Facts insights={insights} />
              <Packaging insights={insights} />
              {insights.hypotheses.length > 0 ? (
                <Hypotheses insights={insights} />
              ) : (
                insights.dataMode === 'insufficient' && <InsufficientNotice />
              )}
              <Experiments insights={insights} />
            </div>

            <div className="space-y-5">
              {insights.nicheReference && <Niche reference={insights.nicheReference} />}
              {!insights.nicheReference && insights.nicheUnavailable && (
                <NicheUnavailable
                  reason={insights.nicheUnavailable.reason}
                  failed={nicheFailed}
                />
              )}
              {!insights.nicheReference && !insights.nicheUnavailable && nicheFailed && (
                <Panel delay={0.04}>
                  <NicheHeading />
                  <p className="mt-2 text-xs text-gray-500" data-testid="insights-partial">
                    The YouTube comparison could not be produced for this report.
                  </p>
                </Panel>
              )}
              <Unlocks insights={insights} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsView;
