import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, FlaskConical, Globe, Lightbulb, RefreshCw } from 'lucide-react';
import { Select } from '../../../../ui/Select';
import type {
  ChannelInsightsV3,
  InsightsNicheComparison,
  InsightsPackaging,
  InsightsPeriod,
} from '../../../../../types/insights';
import { basedOnLabels, coverageSentence } from './format';

/*
 * The Insights tab — a PACKAGING STRATEGY page, not a report.
 *
 * WHAT CHANGED FROM v2, AND WHY. v2 rendered the contract in the order the contract
 * happened to be written: a coverage strip, a grid of measured facts, a row of tiles
 * describing the creator's own thumbnails back to them, hypotheses, experiments, niche
 * medians, an unlock checklist. Everything on that page was true. Nothing on it was
 * worth acting on, and the first two sections were the Overview tab again.
 *
 * v3 leads with the read and demotes everything that is only evidence FOR the read:
 *
 *  - the HEADLINE is the first thing on the page, in the accent colour, because it is
 *    the one sentence the creator came for;
 *  - POSITIONING follows it, as a paragraph, because a strategy read is prose;
 *  - "FIX FIRST" is the left column, numbered, because that is the answer to "so what";
 *  - GAPS sit under the fixes with the THUMBNAILS THEY NAME beside them, because a gap
 *    that cannot point at a real video is not a gap;
 *  - the NICHE column says what peers DO, what this channel does and what to try — never
 *    a median, which is a number about strangers;
 *  - PER-VIDEO NOTES are tiles at the bottom of the right column: one line each, the
 *    detail behind the read rather than the read itself;
 *  - HYPOTHESES and EXPERIMENTS appear only when the views can carry them, and when they
 *    cannot there is one quiet line saying so — not a checklist, not an empty state.
 *
 * THE FACTS GRID IS GONE. `facts[]` still travels in the payload (it is the number
 * guard's allow-list) and one code-generated coverage sentence still says what was
 * looked at. The Overview tab owns the numbers.
 *
 * This component is PURE: it is given a report and renders it. The network, the polling
 * and the regeneration budget all live in ChannelInsightsCard.
 *
 * LAYOUT NOTE — no `flex-col lg:flex-row` and no `hidden md:flex` here.
 * `@coinbase/onchainkit/styles.css` is imported after Tailwind's in src/index.tsx and
 * ships its own unprefixed `.flex-col` / display rules, which beat `.lg\:flex-row` on
 * document order (a media query adds no specificity). Grid columns have no such twin.
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
  insights?: ChannelInsightsV3;
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
  <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Insights{channelName ? ` for ${channelName}` : ''}
      </h1>
      {insights ? (
        <p className="mt-1 text-sm text-gray-400" data-testid="insights-coverage">
          {coverageSentence(insights)}
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">How your packaging reads, and what to change.</p>
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
            <span className="text-gray-600">({refreshRemaining} left)</span>
          </button>
        )}
      </div>
    </div>
  </header>
);

/* -------------------------------------------------------------- the read -- */

/**
 * The headline and the positioning paragraph — the top of the page.
 *
 * Not inside a panel: this is the page's own voice, and boxing it would make it one
 * section among several instead of the thing the rest of the page supports.
 */
const Read: React.FC<{ packaging: InsightsPackaging }> = ({ packaging }) => {
  if (!packaging.headline && !packaging.positioning) return null;
  return (
    <div data-testid="insights-read">
      {packaging.headline && (
        <p className="text-xl font-semibold leading-snug tracking-tight text-[#fa7517] sm:text-2xl">
          {packaging.headline}
        </p>
      )}
      {packaging.positioning && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
          {packaging.positioning}
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ fix first -- */

const Fixes: React.FC<{ packaging: InsightsPackaging }> = ({ packaging }) => {
  if (packaging.fixes.length === 0) return null;
  return (
    <Panel delay={0.02} testId="insights-fixes">
      <h2 className={TITLE}>Fix first</h2>
      <ol className="mt-4 space-y-3">
        {packaging.fixes.map((fix) => (
          <li
            key={`${fix.order}-${fix.title}`}
            className="flex gap-3 rounded-lg border border-gray-800/60 bg-black/20 p-3"
          >
            {/* An ORDER, never an impact label: 1 is the one to do first. */}
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded
                             border border-[#fa7517]/30 text-[11px] font-medium tabular-nums text-[#fa7517]">
              {fix.order}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200">{fix.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">{fix.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
};

/* ----------------------------------------------------------------- gaps -- */

/** The thumbnails a gap names, looked up from the per-video notes that carry them. */
function thumbnailsFor(packaging: InsightsPackaging, videoIds: string[]) {
  return videoIds
    .map((id) => packaging.perVideo.find((note) => note.videoId === id))
    .filter((note): note is NonNullable<typeof note> => Boolean(note));
}

const Gaps: React.FC<{ packaging: InsightsPackaging }> = ({ packaging }) => {
  if (packaging.gaps.length === 0) return null;
  return (
    <Panel delay={0.04} testId="insights-gaps">
      <h2 className={TITLE}>Gaps</h2>
      <p className="mt-1 text-xs text-gray-500">
        Where the packaging and the promise pull in different directions.
      </p>
      <ul className="mt-4 space-y-4">
        {packaging.gaps.map((gap) => {
          const named = thumbnailsFor(packaging, gap.videoIds);
          return (
            <li key={gap.text} className="rounded-lg border border-gray-800/60 bg-black/20 p-3">
              <p className="text-sm leading-relaxed text-gray-300">{gap.text}</p>
              {named.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {named.map((note) => (
                    <li key={note.videoId} className="w-24">
                      {note.thumbnailUrl ? (
                        <img
                          src={note.thumbnailUrl}
                          alt=""
                          className="aspect-video w-full rounded border border-gray-800/60 bg-gray-900 object-cover"
                        />
                      ) : (
                        <div className="aspect-video w-full rounded border border-gray-800/60 bg-gray-900" />
                      )}
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-gray-500">
                        {note.videoTitle}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

/* ---------------------------------------------------------------- niche -- */

const NicheHeading: React.FC = () => (
  <h2 className={TITLE}>
    <Globe className={ICON} aria-hidden="true" />
    Your niche on YouTube
  </h2>
);

const ComparisonList: React.FC<{ label: string; items: string[] }> = ({ label, items }) => {
  if (items.length === 0) return null;
  return (
    <div className="border-t border-gray-800/50 pt-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm leading-snug text-gray-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Conventions, not medians.
 *
 * v2 put "median views per peer video: 15,000" beside a creator with two views, under a
 * disclaimer asking them not to compare. This says what those creators DO instead —
 * which is the part that can be borrowed.
 */
const Niche: React.FC<{
  comparison?: InsightsNicheComparison;
  query?: string;
  disclaimer?: string;
  unavailableReason?: string;
  failed: boolean;
}> = ({ comparison, query, disclaimer, unavailableReason, failed }) => {
  const hasComparison = Boolean(
    comparison && (comparison.theyDo.length || comparison.youDo.length || comparison.tryNext.length)
  );
  if (!hasComparison && !unavailableReason && !failed) return null;

  return (
    <Panel delay={0.04} testId="insights-niche">
      <NicheHeading />

      {hasComparison && comparison ? (
        <>
          {query && (
            <p className="mt-3 inline-block rounded-full border border-gray-800/70 bg-black/40 px-2.5 py-1 text-xs text-gray-300">
              {query}
            </p>
          )}
          <div className="mt-3 space-y-3">
            <ComparisonList label="They do" items={comparison.theyDo} />
            <ComparisonList label="You do" items={comparison.youDo} />
            <ComparisonList label="Try next" items={comparison.tryNext} />
          </div>
          {disclaimer && (
            <p className="mt-4 border-t border-gray-800/50 pt-3 text-xs leading-snug text-gray-500">
              {disclaimer}
            </p>
          )}
        </>
      ) : (
        unavailableReason && (
          <p
            className="mt-2 text-sm leading-relaxed text-gray-400"
            data-testid="insights-niche-unavailable"
          >
            No comparison published — {unavailableReason}
          </p>
        )
      )}

      {/* The LEG is named whenever it failed, whether or not a stale comparison from an
          earlier generation is still on screen. A section that quietly shrinks reads as
          a bug; a named failure reads as a measurement we declined to fake. */}
      {failed && (
        <p className="mt-2 text-xs text-gray-500" data-testid="insights-partial">
          The YouTube comparison could not be produced for this report.
        </p>
      )}
    </Panel>
  );
};

/* ------------------------------------------------------- per-video notes -- */

const PerVideo: React.FC<{ packaging: InsightsPackaging }> = ({ packaging }) => {
  if (packaging.perVideo.length === 0) return null;
  return (
    <Panel delay={0.06} testId="insights-pervideo">
      <h2 className={TITLE}>Video by video</h2>
      <ul className="mt-4 space-y-3">
        {packaging.perVideo.map((note) => (
          <li key={note.videoId} className="flex gap-3">
            {note.thumbnailUrl ? (
              <img
                src={note.thumbnailUrl}
                alt=""
                className="h-12 w-20 shrink-0 rounded border border-gray-800/60 bg-gray-900 object-cover"
              />
            ) : (
              <div className="h-12 w-20 shrink-0 rounded border border-gray-800/60 bg-gray-900" />
            )}
            <div className="min-w-0">
              {note.videoTitle && (
                <p className="line-clamp-1 text-xs font-medium text-gray-300">{note.videoTitle}</p>
              )}
              <p className="mt-0.5 text-xs leading-snug text-gray-500">{note.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
};

/* ------------------------------------------------------------ hypotheses -- */

const Hypotheses: React.FC<{ insights: ChannelInsightsV3 }> = ({ insights }) => {
  if (insights.hypotheses.length === 0) return null;
  return (
    <Panel delay={0.08} testId="insights-hypotheses">
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

/**
 * The hypotheses slot when the views cannot carry one.
 *
 * ONE QUIET LINE. v2 filled this space with an unlock checklist, which turned "we do not
 * know yet" into a to-do list about our own thresholds. The packaging read above already
 * gave the creator something to do; this only explains what is missing and when it
 * arrives.
 */
const NoHypothesesYet: React.FC = () => (
  <p className="text-sm text-gray-500" data-testid="insights-insufficient">
    Performance hypotheses appear once your videos have been watched a few dozen times.
  </p>
);

/* ----------------------------------------------------------- experiments -- */

const Experiments: React.FC<{ insights: ChannelInsightsV3 }> = ({ insights }) => {
  if (insights.experiments.length === 0) return null;
  return (
    <Panel delay={0.1} testId="insights-experiments">
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

/* --------------------------------------------------------------- notices -- */

/** A failed model call is stated, not disguised. */
const FallbackNotice: React.FC<{ reason: string }> = ({ reason }) => (
  <div
    className="flex items-start gap-2.5 rounded-lg border border-gray-800/60 bg-[#0f0f0f] px-4 py-3"
    data-testid="insights-fallback"
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
    <p className="text-sm text-gray-300">
      AI unavailable — showing what we could produce.
      <span className="mt-0.5 block text-xs text-gray-500">{reason}</span>
    </p>
  </div>
);

/** The vision leg failed on its own. Named, not silently absent. */
const PackagingUnavailable: React.FC = () => (
  <Panel testId="insights-partial">
    <p className="text-sm text-gray-400">
      The packaging review could not be produced for this report. Try regenerating in a
      few minutes.
    </p>
  </Panel>
);

/** The layout, drawn empty. A shape that fills in beats a spinner on a blank page. */
const Skeleton: React.FC<{ line: string; testId?: string }> = ({ line, testId }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-500" data-testid={testId}>
      {line}
    </p>
    <div className={`${PANEL} h-20 animate-pulse bg-gray-900/40`} />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-5">
        <div className={`${PANEL} h-56 animate-pulse bg-gray-900/40`} />
        <div className={`${PANEL} h-40 animate-pulse bg-gray-900/40`} />
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
 * The backend's 429 body already says which budget ran out and it is the only place that
 * knows; axios's default ("Request failed with status code 429") says nothing. The
 * generic client retry is disabled for this request precisely so this message survives
 * to be shown — see `isInsightsRegeneration` in src/api/index.ts.
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
  insights?: ChannelInsightsV3;
  channelName?: string;
  period: InsightsPeriod;
  /** Omitted when the caller owns no period control (tests drive the card directly). */
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
  const packaging = insights?.packaging;
  const nicheFailed = insights?.partial?.includes('nicheReference') ?? false;
  const packagingFailed = insights?.partial?.includes('packaging') ?? false;

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

      {/* A generation already in flight — ours, or somebody else's paying for the same
          report. With nothing on screen yet it gets the empty layout; with a previous
          report on screen it is one line above intact data. */}
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
      {isLoading && !isGenerating && <Skeleton line="Reading your packaging…" />}

      {insights && (
        <>
          {insights.fallback && <FallbackNotice reason={insights.fallback.reason} />}
          {packagingFailed && <PackagingUnavailable />}

          {packaging && <Read packaging={packaging} />}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-5">
              {packaging && <Fixes packaging={packaging} />}
              {packaging && <Gaps packaging={packaging} />}
            </div>

            <div className="space-y-5">
              <Niche
                comparison={packaging?.nicheComparison}
                query={insights.nicheReference?.query}
                disclaimer={insights.nicheReference?.disclaimer}
                unavailableReason={
                  packaging?.nicheComparison ? undefined : insights.nicheUnavailable?.reason
                }
                failed={nicheFailed}
              />
              {packaging && <PerVideo packaging={packaging} />}
            </div>
          </div>

          {insights.hypotheses.length > 0 ? <Hypotheses insights={insights} /> : <NoHypothesesYet />}
          <Experiments insights={insights} />
        </>
      )}
    </div>
  );
};

export default InsightsView;
