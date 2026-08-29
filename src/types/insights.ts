/*
 * Creator AI Insights — the v3 contract (schemaVersion 3).
 *
 * WHY v3. v2 was honest and useless. On a channel with two views it rendered a grid of
 * measured facts the Overview tab had already shown, a row of descriptive pass-1
 * observations ("image shows a city scene", "dominant colours pink"), and a set of niche
 * medians. Every line was true and not one of them told the creator what to do
 * differently on Monday.
 *
 * WHAT CHANGED. The centre of the report is now PACKAGING STRATEGY — the read that is
 * worth something at zero traffic, because it is about what the channel LOOKS LIKE
 * rather than about how it performed:
 *
 *  - `packaging.positioning` — what the channel looks like it is, from its own titles
 *    and thumbnails.
 *  - `packaging.headline` — one sharp, channel-specific sentence.
 *  - `packaging.gaps[]` — each naming REAL videoIds on this channel.
 *  - `packaging.fixes[]` — strategic, ordered (1 = do first).
 *  - `packaging.perVideo[]` — one line per reviewed thumbnail.
 *  - `packaging.nicheComparison` — what YouTube peers in the same topic DO, what this
 *    channel does, and what to try next. Conventions, not medians.
 *
 * WHAT SURVIVED UNCHANGED. Everything that made v2 trustworthy:
 *  - `facts[]` are still DETERMINISTIC, computed in TypeScript from the same queries the
 *    dashboard cards read. They are no longer RENDERED as a grid (the Overview tab owns
 *    that job) but they stay in the payload, because they are the allow-list the number
 *    guard checks the model's prose against.
 *  - `hypotheses[]` are HEDGED and only exist when the data can carry them
 *    (`dataMode !== 'insufficient'`), with the low-confidence prefix applied in code.
 *  - `nicheReference` is a YouTube reference, labelled as such, never a target.
 *  - `fallback` is present IFF the model leg failed; `partial[]` names a single leg that
 *    failed while the rest succeeded.
 *
 * WHAT WAS DELETED. `observations[]` — the v2 pass-1 tiles. A description of a picture
 * the creator is looking at is not an insight; `packaging.perVideo[]` replaces it with a
 * line that says something about the packaging DECISION instead.
 *
 * This file is the FRONTEND MIRROR of `src/types/insights.ts` in base-be. Keep them in
 * step: the backend copy is the source of truth, this one exists so the FE compiles
 * without importing across repositories.
 */

/** Bump when a field changes meaning. The FE refuses to render an unknown version. */
export const INSIGHTS_SCHEMA_VERSION = 3 as const;

export type InsightsPeriod = '7d' | '30d' | '90d' | 'all';

/**
 * How much measured data the generation actually had.
 *
 * THRESHOLDS ARE CODE, NOT PROMPT. A prompt asking a model to "be careful with thin
 * data" is a request; a branch that refuses to produce hypotheses is a guarantee.
 *  - `insufficient` (< 20 counted views in the period): packaging + niche comparison
 *    only. No hypotheses, no experiments, and NO VIEW COUNTS reach the model at all.
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
 * sums over the rows we happened to serialise into a prompt. What the MODEL saw is
 * reported separately, in `sample` and in `packaging.reviewed`.
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
 * The synthesis sample: the rows serialised into the hypotheses prompt.
 *
 * `size` of `of` — when they differ, the model reasoned over a subset while every FACT
 * above it is catalogue-wide. Saying so is the difference between a sample and a silent
 * lie.
 */
export interface InsightsSample {
  size: number;
  of: number;
}

/**
 * A measured statement. `text` is generated from `value` in TypeScript, so the number
 * in the sentence and the number in the field can never disagree.
 *
 * v3 does NOT render these as a section — the Overview tab already shows them, and
 * restating measurements was half of what made v2 feel like a paraphrase. They remain
 * in the payload because they are the ALLOW-LIST the number guard checks model prose
 * against, and because the header's one coverage sentence is built from `coverage`.
 */
export interface InsightFact {
  text: string;
  /** Stable machine key, e.g. `views`, `median_views_per_video`. */
  metric: string;
  value: number;
  unit?: 'views' | 'videos' | 'seconds' | 'hours' | 'percent' | 'count' | 'per_week' | 'characters';
  source: 'basetube';
}

/**
 * A packaging gap, NAMING THE VIDEOS IT IS ABOUT.
 *
 * `videoIds` is validated against the set the analyst actually saw before publication —
 * a gap that points at no real video is an assertion about a catalogue we did not show
 * it, so it is dropped rather than rendered without its evidence.
 */
export interface InsightsPackagingGap {
  text: string;
  videoIds: string[];
}

/** A strategic fix. `order` is a SEQUENCE (1 = do first), never an impact label. */
export interface InsightsPackagingFix {
  title: string;
  detail: string;
  order: number;
}

/** One line about one reviewed thumbnail. Rendering data travels with it. */
export interface InsightsPerVideoNote {
  videoId: string;
  note: string;
  videoTitle?: string;
  thumbnailUrl?: string | null;
}

/**
 * The niche read, as CONVENTIONS rather than medians.
 *
 * "Peers average 41-character titles" is a statistic about strangers; "they open with
 * the outcome, you open with the topic" is something a creator can act on this evening.
 * Every string here is guard-swept exactly like the rest of the packaging read.
 */
export interface InsightsNicheComparison {
  theyDo: string[];
  youDo: string[];
  tryNext: string[];
}

/** THE CENTREPIECE. One vision call over the channel's own packaging (+ its peers). */
export interface InsightsPackaging {
  /** 2-3 sentences: what the channel looks like it is, judged from its packaging. */
  positioning: string;
  /** One sharp sentence. Rendered first, in the accent colour. */
  headline: string;
  gaps: InsightsPackagingGap[];
  fixes: InsightsPackagingFix[];
  perVideo: InsightsPerVideoNote[];
  /** Present only when at least NICHE_MIN_PEERS peers were found and fed to the call. */
  nicheComparison?: InsightsNicheComparison;
  /** How many of the channel's own thumbnails the analyst actually saw. */
  reviewed: number;
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
 * YouTube peers found by topic-seeding the creator's own titles.
 *
 * v3 keeps this in the PAYLOAD (it is already computed, and `query` / `peerCount` /
 * `disclaimer` provenance the comparison) but no longer renders the medians:
 * `medianViewsPerVideo` in particular is a number about other people on another
 * platform, and putting it beside a creator's own view count invited exactly the
 * comparison the disclaimer spends a sentence forbidding.
 */
export interface InsightsNicheReference {
  query: string;
  peerCount: number;
  window: string;
  medianViewsPerVideo: number;
  /**
   * NULL when the sample could not measure it — one search returns one or two videos
   * per channel, and a cadence needs two dated uploads from the same channel.
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
 * A peer video carried alongside the reference so the packaging analyst can SEE the
 * conventions rather than be told medians about them.
 *
 * Cached with the reference (same 7-day entry, same single billed search), so turning
 * the comparison on costs nothing beyond the images the vision call already fetches.
 */
export interface InsightsNichePeer {
  title: string;
  thumbnailUrl?: string;
  channelTitle?: string;
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
 * Peers required before any comparison is published.
 *
 * A "convention" drawn from one or two search results is a coincidence wearing the
 * clothes of a pattern. Below this we omit the whole section rather than dress it up.
 */
export const NICHE_MIN_PEERS = 5;

/** The FIXED disclaimer. Never model-written, never varied per channel. */
export const NICHE_REFERENCE_DISCLAIMER =
  'YouTube peers found by your topics — a reference, not a target.';

/** Present IFF the model leg failed. Deterministic sections are still populated. */
export interface InsightsFallback {
  reason: string;
}

export interface ChannelInsightsV3 {
  schemaVersion: typeof INSIGHTS_SCHEMA_VERSION;
  channelId: number;
  period: InsightsPeriod;
  /** ISO-8601 UTC. The FE renders "Updated 2 h ago" from it. */
  generatedAt: string;
  dataMode: InsightsDataMode;
  coverage: InsightsCoverage;
  /** Measured, deterministic, NOT rendered as a section. See InsightFact. */
  facts: InsightFact[];
  /** Absent when the vision leg failed (then `partial` names it). */
  packaging?: InsightsPackaging;
  hypotheses: InsightHypothesis[];
  experiments: InsightExperiment[];
  /** Rows the hypotheses model actually saw, against the catalogue size. */
  sample: InsightsSample;
  nicheReference?: InsightsNicheReference;
  /** Present instead of `nicheReference` when we declined to publish one. */
  nicheUnavailable?: InsightsNicheUnavailable;
  /**
   * Legs that failed while the rest succeeded, e.g. `['packaging']` when the vision
   * pass was down. The FE says what is missing instead of silently rendering a report
   * with one section absent and no explanation.
   */
  partial?: InsightsPartialLeg[];
  fallback?: InsightsFallback;
}

/** Sections that can fail independently of the report as a whole. */
export type InsightsPartialLeg = 'packaging' | 'nicheReference';

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
