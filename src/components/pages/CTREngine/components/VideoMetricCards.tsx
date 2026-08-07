// src/components/pages/CTREngine/components/VideoMetricCards.tsx
//
// The per-video metrics block of the v2.1 report (LOCKED layout — see
// base-be docs/specs/moat-phase-0-1-spec.md, "ADDENDUM v2.1 → FE rendering"):
//
//   THREE CARDS      Reach (impressions, CTR, evidence, baseline)
//                    Hold  (average % viewed primary, duration secondary)
//                    Conversion (subs per 1,000 views primary, subs secondary)
//   CHIPS, NOT CARDS traffic source · coverage range · verified/self-reported ·
//                    freshness
//
// Two rules this file exists to enforce:
//
//   1. NEVER ZERO-FILL. A metric that is absent renders the REASON it is absent
//      ("Syncing — usually 24-48h", "Not included in export", …), never `0`,
//      never `—` without a why.
//   2. TRUST IS ORTHOGONAL TO EVIDENCE. `evidenceStrength` says how much CTR
//      evidence exists; `trust` says where the number came from. A metric can be
//      "observational" AND "self-reported" — both labels render, side by side.
//
// Provenance is resolved PER METRIC via `availability[key].datasetId`, which is
// what makes the hybrid mode honest: the same video can show a self-reported
// Reach card above a verified Hold card.

import React from 'react';
import {
  Eye,
  MousePointerClick,
  Clock,
  Gauge,
  UserPlus,
  BadgeCheck,
  FileSpreadsheet,
  CalendarRange,
  Compass,
  RefreshCw,
} from 'lucide-react';
import type {
  AuditMetricKey,
  MetricAvailability,
  MetricDataset,
  PerVideoMetricsV21,
} from '../../../../types/ctr';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const formatMetricCount = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(value);
};

/** seconds → "6:42" */
export const formatMetricDuration = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** "2026-07-09" → "Jul 9". Parsed as parts, never as a Date (no TZ shifting). */
const formatShortDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${MONTHS[m - 1]} ${d}`;
};

const dayCount = (startDate: string, endDate: string): number => {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.round((end - start) / 86_400_000) + 1; // inclusive
};

/** "May 5 – Jun 1" for a range, "Lifetime" for lifetime coverage. */
export const formatCoverage = (dataset: MetricDataset | undefined): string => {
  if (!dataset) return '';
  const { coverage } = dataset;
  if (coverage.kind === 'lifetime') return 'Lifetime';
  return `${formatShortDate(coverage.startDate)} – ${formatShortDate(coverage.endDate)}`;
};

/**
 * How to say "views" without lying. `analyticsViews` is window views, so the
 * window is part of the label — a bare "views" is banned for this metric.
 */
export const formatViewWindow = (dataset: MetricDataset | undefined): string => {
  if (!dataset) return 'in the reported window';
  if (dataset.coverage.kind === 'lifetime') return 'lifetime totals';
  const days = dayCount(dataset.coverage.startDate, dataset.coverage.endDate);
  if (days === 28) return 'last 28 days';
  if (days > 0) return `last ${days} days`;
  return formatCoverage(dataset);
};

/** ISO timestamp → "Aug 6". */
const formatIsoDay = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return formatShortDate(iso.slice(0, 10));
};

// ---------------------------------------------------------------------------
// Availability wording — the ONLY place absence is put into words
// ---------------------------------------------------------------------------

/** Short label shown in place of a value. `null` = the value itself renders. */
export const availabilityWording = (
  availability: MetricAvailability | undefined
): { label: string; hint?: string; tone: 'muted' | 'syncing' } | null => {
  if (!availability) return { label: 'Not reported', tone: 'muted' };

  switch (availability.state) {
    case 'ready':
      return null;
    case 'syncing':
      return {
        label: 'Syncing — usually 24-48h',
        hint: 'YouTube backfills impressions and click-through rate asynchronously.',
        tone: 'syncing',
      };
    case 'not_provided':
      return {
        label: 'Not included in export',
        hint: 'This column was not part of the Studio export you uploaded.',
        tone: 'muted',
      };
    case 'suppressed':
      if (availability.reason === 'low_impressions') {
        return {
          label: 'not enough data',
          hint: 'Too few impressions to read anything into this video’s CTR.',
          tone: 'muted',
        };
      }
      if (availability.reason === 'no_valid_cohort') {
        return {
          label: 'No comparable baseline',
          hint: 'No group of your own videos matched closely enough to compare against.',
          tone: 'muted',
        };
      }
      return {
        label: 'Outside the confirmed range',
        hint: 'This number covers a different window than the rest of the report.',
        tone: 'muted',
      };
    case 'unavailable':
      if (availability.reason === 'invalid_source_data') {
        return {
          label: 'Unreadable in the source',
          hint: 'The values for this column could not be parsed.',
          tone: 'muted',
        };
      }
      if (availability.reason === 'unsupported') {
        return { label: 'Not available for this video', tone: 'muted' };
      }
      return {
        label: 'Could not be loaded',
        hint: 'The request for this metric failed. It will be retried.',
        tone: 'muted',
      };
    default:
      return { label: 'Not reported', tone: 'muted' };
  }
};

const AbsentValue: React.FC<{ availability: MetricAvailability | undefined }> = ({
  availability,
}) => {
  const wording = availabilityWording(availability);
  if (!wording) return null;
  return (
    <span
      title={wording.hint}
      className={`inline-flex items-center gap-1.5 text-xs ${
        wording.tone === 'syncing' ? 'text-blue-300' : 'text-gray-500'
      }`}
    >
      {wording.tone === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
      {wording.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Evidence strength — impression volume only. Never a quality score.
// ---------------------------------------------------------------------------

const EVIDENCE_CHIP: Record<
  PerVideoMetricsV21['evidenceStrength'],
  { label: string; className: string; title: string }
> = {
  insufficient: {
    label: 'not enough data',
    className: 'bg-white/5 text-gray-400 border-white/10',
    title: 'Too few impressions to read anything into this video’s CTR.',
  },
  directional: {
    label: 'directional',
    className: 'bg-[#fa7517]/10 text-[#fa7517] border-[#fa7517]/25',
    title: 'Enough impressions to point somewhere — not enough to conclude.',
  },
  observational: {
    label: 'observational',
    className: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
    title: 'Enough impressions to describe what happened. Still not a cause.',
  },
};

// ---------------------------------------------------------------------------
// Trust badge — orthogonal to evidence, resolved PER CARD
// ---------------------------------------------------------------------------

const TrustBadge: React.FC<{ trust: MetricDataset['trust'] | null; compact?: boolean }> = ({
  trust,
  compact,
}) => {
  if (!trust) return null;

  if (trust === 'verified') {
    return (
      <span
        title="Read directly from your connected YouTube Analytics."
        className={`inline-flex items-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-300 ${
          compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
        }`}
      >
        <BadgeCheck className="w-3 h-3" />
        Verified
      </span>
    );
  }

  return (
    <span
      title="Taken from a Studio export you uploaded. We have not verified it against YouTube."
      className={`inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 font-semibold text-amber-300 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
      }`}
    >
      <FileSpreadsheet className="w-3 h-3" />
      Self-reported
    </span>
  );
};

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  trust: MetricDataset['trust'] | null;
  children: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, trust, children }) => (
  // `w-[240px] max-w-full` + flex-wrap rather than a grid with sm: variants —
  // this app emits `.flex-col`/`.w-full` after the sm: rules, so responsive
  // variants lose the specificity fight. Wrapping gives the same behaviour.
  <div className="w-[240px] max-w-full flex-1 basis-[220px] rounded-xl border border-gray-800/60 bg-black/40 p-3">
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </span>
      <TrustBadge trust={trust} compact />
    </div>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Chips
// ---------------------------------------------------------------------------

const Chip: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  title?: string;
  tone?: 'default' | 'amber' | 'emerald';
}> = ({ icon: Icon, children, title, tone = 'default' }) => {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : 'border-gray-800/60 bg-black/40 text-gray-400';

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] ${toneClass}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
};

// ---------------------------------------------------------------------------

export interface VideoMetricCardsProps {
  metrics: PerVideoMetricsV21;
}

/**
 * Resolve the dataset a given metric came from. Only `ready` and `suppressed`
 * carry a datasetId — a syncing or missing metric has no provenance to show.
 */
const useDatasetResolver = (metrics: PerVideoMetricsV21) => {
  const byId = React.useMemo(
    () => new Map(metrics.datasets.map((dataset) => [dataset.id, dataset])),
    [metrics.datasets]
  );

  return React.useCallback(
    (key: AuditMetricKey): MetricDataset | undefined => {
      const availability = metrics.availability?.[key];
      if (!availability) return undefined;
      if (availability.state === 'ready' || availability.state === 'suppressed') {
        return byId.get(availability.datasetId);
      }
      return undefined;
    },
    [byId, metrics.availability]
  );
};

export const VideoMetricCards: React.FC<VideoMetricCardsProps> = ({ metrics }) => {
  const datasetFor = useDatasetResolver(metrics);
  const availabilityFor = (key: AuditMetricKey): MetricAvailability | undefined =>
    metrics.availability?.[key];

  const isReady = (key: AuditMetricKey) => availabilityFor(key)?.state === 'ready';

  // Per-card trust: the dataset behind that card's PRIMARY metric.
  const reachDataset = datasetFor('impressions') ?? datasetFor('ctr');
  const holdDataset = datasetFor('averageViewPercentage') ?? datasetFor('averageViewDuration');
  const conversionDataset =
    datasetFor('subscribersGainedPerThousandViews') ?? datasetFor('subscribersGained');
  const viewsDataset = datasetFor('analyticsViews');

  const evidence = EVIDENCE_CHIP[metrics.evidenceStrength] ?? EVIDENCE_CHIP.insufficient;

  // Chip row provenance: whichever datasets actually back this video.
  const usedDatasets = metrics.datasets ?? [];
  const verifiedDataset = usedDatasets.find((d) => d.trust === 'verified');
  const uploadedDataset = usedDatasets.find((d) => d.trust === 'self_reported');
  const mixed = !!verifiedDataset && !!uploadedDataset;

  const trafficAvailability = availabilityFor('traffic');
  const trafficWording = availabilityWording(trafficAvailability);

  return (
    <div className="mt-4">
      {/* ---------------- THE THREE CARDS ---------------- */}
      <div className="flex flex-wrap gap-3">
        {/* REACH — did it get shown, and did people click */}
        <MetricCard icon={Eye} title="Reach" trust={reachDataset?.trust ?? null}>
          {isReady('impressions') && metrics.impressions !== null ? (
            <p className="text-lg font-bold text-white leading-none">
              {formatMetricCount(metrics.impressions)}{' '}
              <span className="text-xs font-normal text-gray-500">impressions</span>
            </p>
          ) : (
            <div className="text-lg font-bold text-white leading-none">
              <AbsentValue availability={availabilityFor('impressions')} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            {isReady('ctr') && metrics.ctr !== null ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                <MousePointerClick className="w-3.5 h-3.5 text-gray-500" />
                {metrics.ctr.toFixed(1)}%
                <span className="text-xs text-gray-500">CTR</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-gray-600" />
                <AbsentValue availability={availabilityFor('ctr')} />
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              title={evidence.title}
              className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${evidence.className}`}
            >
              {evidence.label}
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            {isReady('baselineDelta') && metrics.baselineDelta ? (
              metrics.baselineDelta
            ) : (
              <AbsentValue availability={availabilityFor('baselineDelta')} />
            )}
          </div>
        </MetricCard>

        {/* HOLD — of the people who clicked, how much did they watch */}
        <MetricCard icon={Gauge} title="Hold" trust={holdDataset?.trust ?? null}>
          {isReady('averageViewPercentage') && metrics.averageViewPercentage !== null ? (
            <p className="text-lg font-bold text-white leading-none">
              {metrics.averageViewPercentage.toFixed(1)}%{' '}
              <span className="text-xs font-normal text-gray-500">average viewed</span>
            </p>
          ) : (
            <div className="text-lg font-bold text-white leading-none">
              <AbsentValue availability={availabilityFor('averageViewPercentage')} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            {isReady('averageViewDuration') && metrics.averageViewDuration !== null ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {formatMetricDuration(metrics.averageViewDuration)}
                <span className="text-xs text-gray-500">average view duration</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-600" />
                <AbsentValue availability={availabilityFor('averageViewDuration')} />
              </span>
            )}
          </div>
        </MetricCard>

        {/* CONVERSION — did watching turn into subscribing */}
        <MetricCard icon={UserPlus} title="Conversion" trust={conversionDataset?.trust ?? null}>
          {isReady('subscribersGainedPerThousandViews') &&
          metrics.subscribersGainedPerThousandViews !== null ? (
            <p className="text-lg font-bold text-white leading-none">
              {metrics.subscribersGainedPerThousandViews.toFixed(1)}{' '}
              <span className="text-xs font-normal text-gray-500">subs per 1,000 views</span>
            </p>
          ) : (
            <div className="text-lg font-bold text-white leading-none">
              <AbsentValue availability={availabilityFor('subscribersGainedPerThousandViews')} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            {isReady('subscribersGained') && metrics.subscribersGained !== null ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                <UserPlus className="w-3.5 h-3.5 text-gray-500" />
                {formatMetricCount(metrics.subscribersGained)}
                <span className="text-xs text-gray-500">subscribers gained</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-gray-600" />
                <AbsentValue availability={availabilityFor('subscribersGained')} />
              </span>
            )}
          </div>

          {/* The denominator, never called just "views". */}
          {isReady('analyticsViews') && metrics.analyticsViews !== null && (
            <p className="mt-2 text-xs text-gray-500">
              out of {formatMetricCount(metrics.analyticsViews)} views ·{' '}
              {formatViewWindow(viewsDataset)}
            </p>
          )}
        </MetricCard>
      </div>

      {/* ---------------- CHIPS (never cards) ---------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Traffic */}
        {isReady('traffic') && metrics.traffic ? (
          <Chip
            icon={Compass}
            title={`Share is measured on ${metrics.traffic.basis}.`}
          >
            {metrics.traffic.dominant} · {Math.round(metrics.traffic.sharePercent)}% of{' '}
            {metrics.traffic.basis}
          </Chip>
        ) : (
          trafficWording && (
            <Chip icon={Compass} title={trafficWording.hint}>
              Traffic source: {trafficWording.label}
            </Chip>
          )
        )}

        {/* Coverage range — one chip per distinct window backing this video */}
        {usedDatasets.map((dataset) => (
          <Chip key={`coverage-${dataset.id}`} icon={CalendarRange}>
            {formatCoverage(dataset)}
          </Chip>
        ))}

        {/* Trust — overall for the video. Per-metric truth is on the cards. */}
        {mixed ? (
          <Chip
            icon={FileSpreadsheet}
            tone="amber"
            title="Some metrics come from your connected Analytics, others from an upload. Each card says which."
          >
            Mixed sources — Verified + Self-reported
          </Chip>
        ) : verifiedDataset ? (
          <Chip icon={BadgeCheck} tone="emerald" title="Read from your connected YouTube Analytics.">
            Verified
          </Chip>
        ) : uploadedDataset ? (
          <Chip
            icon={FileSpreadsheet}
            tone="amber"
            title="From a Studio export you uploaded. Not verified against YouTube."
          >
            Self-reported
          </Chip>
        ) : null}

        {/* Freshness */}
        {verifiedDataset && (
          <Chip icon={BadgeCheck}>
            Verified through{' '}
            {formatIsoDay(
              verifiedDataset.coverage.endDate ?? verifiedDataset.asOf.slice(0, 10)
            )}
          </Chip>
        )}
        {uploadedDataset && (
          <Chip icon={FileSpreadsheet}>Uploaded {formatIsoDay(uploadedDataset.asOf)}</Chip>
        )}
      </div>
    </div>
  );
};

export default VideoMetricCards;
