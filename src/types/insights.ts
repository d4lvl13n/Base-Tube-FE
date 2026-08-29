/*
 * Creator AI Insights — the v2 contract (schemaVersion 2).
 *
 * WHY A NEW CONTRACT. v1 (`AnalyticsInsightService` + the `channel_analytics_insight`
 * branch of `aiService.buildPrompt`) serialised three liked videos and a handful of
 * hourly counts into a prompt that then instructed the model to "cite" geography,
 * growth rates and posting-time patterns it had never been given. Everything the tab
 * rendered past the first paragraph was therefore invented, and the fallback prose was
 * word-for-word indistinguishable from model output. See
 * docs/ANALYTICS_REVIEW_2026-08-29.md (base-be) finding 9.
 *
 * THE RULES THIS SHAPE ENCODES:
 *  - `facts[]` are DETERMINISTIC. They are computed in TypeScript from the same
 *    queries the dashboard cards read, never written by a model, and they carry the
 *    number they are about so the FE never has to re-derive it from prose.
 *  - `observations[]` come from the audit's blind PASS 1 (thumbnail + title only,
 *    guard-filtered) run over OUR OWN assets. No performance data reaches that pass.
 *  - `hypotheses[]` are HEDGED and only exist when the data can carry them
 *    (`dataMode !== 'insufficient'`).
 *  - `nicheReference` is a YouTube reference, labelled as such, never a target.
 *  - `fallback` is present IFF the model leg failed. Facts, coverage and the niche
 *    reference survive it, because none of them needed a model. The FE renders this
 *    branch in a visually distinct, muted style — an honest "AI unavailable".
 *
 * This file is the FRONTEND MIRROR of `src/types/insights.ts` in base-be. Keep them in
 * step: the backend copy is the source of truth, this one exists so the FE compiles
 * without importing across repositories.
 */

/** Bump when a field changes meaning. The FE refuses to render an unknown version. */
export const INSIGHTS_SCHEMA_VERSION = 2 as const;

export type InsightsPeriod = '7d' | '30d' | '90d' | 'all';

/**
 * How much measured data the generation actually had.
 *
 * THRESHOLDS ARE CODE, NOT PROMPT. A prompt asking a model to "be careful with thin
 * data" is a request; a branch that refuses to produce hypotheses is a guarantee.
 *  - `insufficient` (< 20 counted views in the period): facts + niche reference +
 *    packaging observations only. No hypotheses, no experiments, and the FE says so.
 *  - `thin` (< 200): hypotheses allowed, every one prefixed low-confidence by the guard.
 *  - `ok`: normal.
 */
export type InsightsDataMode = 'insufficient' | 'thin' | 'ok';

/** Counted views below this: no hypotheses at all. */
export const INSUFFICIENT_VIEWS_THRESHOLD = 20;
/** Counted views below this: hypotheses are marked low-confidence. */
export const THIN_VIEWS_THRESHOLD = 200;

/** A posting-hour / weekday read needs at least this many views to be worth saying. */
export const POSTING_PATTERN_MIN_VIEWS = 30;

/**
 * What the report was computed from.
 *
 * CATALOGUE-WIDE, NOT THE SAMPLE. `views`, `videos` and `watchSeconds` are aggregates
 * over every analytics-visible video on the channel, from dedicated SQL — they are not
 * sums over the rows we happened to serialise into the prompt. An earlier cut computed
 * them from the 40 highest-viewed rows and labelled the result "your catalogue", which
 * is exactly the mislabelling this rebuild exists to delete. What the MODEL saw is
 * reported separately, in `sample`.
 */
export interface InsightsCoverage {
  /** Counted views (`is_counted = 1`) inside the period, across the whole catalogue. */
  views: number;
  /** Analytics-visible videos on the channel. Not a page, not a sample. */
  videos: number;
  /** Total watched seconds inside the period, across the whole catalogue. */
  watchSeconds: number;
  /** Days in the window; `null` for 'all' (the window is the channel's lifetime). */
  days: number | null;
}

/**
 * The synthesis sample: the rows actually serialised into the pass-2 prompt.
 *
 * `size` of `of` — when they differ, the model reasoned over a subset (the highest-view
 * rows, so every watched video is present) while every FACT above it is catalogue-wide.
 * Saying so is the difference between a sample and a silent lie.
 */
export interface InsightsSample {
  size: number;
  of: number;
}

/**
 * A measured statement. `text` is generated from `value` in TypeScript, so the number
 * in the sentence and the number in the field can never disagree.
 */
export interface InsightFact {
  text: string;
  /** Stable machine key, e.g. `views`, `median_views_per_video`. */
  metric: string;
  value: number;
  unit?: 'views' | 'videos' | 'seconds' | 'hours' | 'percent' | 'count' | 'per_week' | 'characters';
  source: 'basetube';
}

/** PASS 1 output: a countable, checkable fact about one of our thumbnails/titles. */
export interface InsightObservation {
  videoId?: string;
  text: string;
  /** Additive, for rendering only — the FE shows the thumbnail beside the line. */
  videoTitle?: string;
  thumbnailUrl?: string | null;
}

/** PASS 2 output: a hedged guess, never a finding. */
export interface InsightHypothesis {
  text: string;
  /** Fact metrics / videoIds the model was pointed at. Never a causal claim. */
  basedOn: string[];
}

/** PASS 2 output: something the creator can actually run. */
export interface InsightExperiment {
  title: string;
  /** Concrete description of the variant to build. */
  variantBrief: string;
  /** How to run it and how to know it is done. */
  method: string;
  /** An ORDER (1 = run first), never a high/medium/low impact label. */
  priority: number;
}

/**
 * YouTube peers found by topic-seeding the creator's own titles. Medians are computed
 * in TypeScript from the provider payload; `commonPatterns` is the only model-written
 * part and is guard-filtered.
 */
export interface InsightsNicheReference {
  query: string;
  peerCount: number;
  window: string;
  medianViewsPerVideo: number;
  /**
   * NULL when the sample could not measure it — one search returns one or two videos
   * per channel, and a cadence needs two dated uploads from the same channel. Null
   * travels all the way to the FE, which omits the row. It is never coerced to 0: a
   * zero here reads as "these creators do not upload", which is a measurement we did
   * not make.
   */
  medianUploadsPerWeek: number | null;
  medianTitleLength: number;
  /**
   * Structural patterns whose stated counts have been RE-COUNTED against the supplied
   * titles in code. A model-written pattern whose count cannot be reproduced is
   * dropped, not corrected — see NicheReferenceService.
   */
  commonPatterns: string[];
  disclaimer: string;
}

/**
 * Why there is no niche reference this time. Present INSTEAD of `nicheReference`.
 *
 * A missing section with no explanation reads as a bug; a stated reason reads as a
 * measurement we declined to fake.
 */
export interface InsightsNicheUnavailable {
  reason: string;
}

/**
 * Peers required before any median is published.
 *
 * A "median" of one or two search results is a single number wearing the clothes of a
 * statistic. Below this we omit the whole section rather than dress up a coincidence.
 */
export const NICHE_MIN_PEERS = 5;

/** The FIXED disclaimer. Never model-written, never varied per channel. */
export const NICHE_REFERENCE_DISCLAIMER =
  'YouTube peers found by your topics. Different platform and audience — a reference, not a target.';

/** Present IFF the model leg failed. Deterministic sections are still populated. */
export interface InsightsFallback {
  reason: string;
}

export interface ChannelInsightsV2 {
  schemaVersion: typeof INSIGHTS_SCHEMA_VERSION;
  channelId: number;
  period: InsightsPeriod;
  /** ISO-8601 UTC. The FE renders "Generated 2 h ago" from it. */
  generatedAt: string;
  dataMode: InsightsDataMode;
  coverage: InsightsCoverage;
  facts: InsightFact[];
  observations: InsightObservation[];
  hypotheses: InsightHypothesis[];
  experiments: InsightExperiment[];
  /** Rows the pass-2 model actually saw, against the catalogue size. */
  sample: InsightsSample;
  nicheReference?: InsightsNicheReference;
  /** Present instead of `nicheReference` when we declined to publish one. */
  nicheUnavailable?: InsightsNicheUnavailable;
  /**
   * Legs that failed while the rest succeeded, e.g. `['observations']` when the vision
   * pass was down. The FE says "packaging review unavailable" instead of silently
   * rendering a report with one section missing and no explanation.
   */
  partial?: InsightsPartialLeg[];
  fallback?: InsightsFallback;
}

/** Sections that can fail independently of the report as a whole. */
export type InsightsPartialLeg = 'observations' | 'nicheReference';

/** Envelope the route returns alongside `data`. */
export interface ChannelInsightsMeta {
  /** True when the payload came from the 24 h Redis entry rather than a generation. */
  cached: boolean;
  /** Manual regenerations left today for this channel (see REFRESH_DAILY_LIMIT). */
  refreshRemaining: number;
}

/** Manual `?refresh=1` regenerations allowed per channel per UTC day. */
export const REFRESH_DAILY_LIMIT = 3;

/**
 * Generations allowed per USER per UTC day, across every channel they own.
 *
 * The per-channel refresh budget caps one dashboard; a creator with eight channels
 * could still spend twenty-four generations a day by walking across them. This is the
 * account-level ceiling on paid work, and unlike the refresh budget it counts every
 * generation, cache miss or manual refresh alike.
 */
export const ACCOUNT_DAILY_GENERATION_LIMIT = 20;
