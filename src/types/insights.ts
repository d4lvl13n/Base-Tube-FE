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

/** What the model actually saw. Rendered verbatim by the FE coverage strip. */
export interface InsightsCoverage {
  /** Counted views (`is_counted = 1`) inside the period. */
  views: number;
  /** Videos whose rows were serialised into the prompt. */
  videos: number;
  /** Total watched seconds inside the period. */
  watchSeconds: number;
  /** Days in the window; `null` for 'all' (the window is the channel's lifetime). */
  days: number | null;
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
  medianUploadsPerWeek: number;
  medianTitleLength: number;
  commonPatterns: string[];
  disclaimer: string;
}

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
  nicheReference?: InsightsNicheReference;
  fallback?: InsightsFallback;
}

/** Envelope the route returns alongside `data`. */
export interface ChannelInsightsMeta {
  /** True when the payload came from the 24 h Redis entry rather than a generation. */
  cached: boolean;
  /** Manual regenerations left today for this channel (see REFRESH_DAILY_LIMIT). */
  refreshRemaining: number;
}

/** Manual `?refresh=1` regenerations allowed per channel per UTC day. */
export const REFRESH_DAILY_LIMIT = 3;
