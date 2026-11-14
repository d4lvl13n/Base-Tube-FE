export interface ViewConfigThresholds {
  percentage: number;  // Default: 30 (%)
  seconds: number;    // Default: 30 (seconds)
}

export interface ViewConfigLimits {
  maxViewsPerDay: number;      // Default: 10
  /** Same as maxViewsPerDay: the creator's own views follow the ordinary rule. */
  maxOwnerViews: number;
  maxConcurrentViews: number;  // Default: 2
}

/**
 * The view counting rule as the server enforces it
 * (base-be services/viewCountingRules.ts). Sent in `countingRules` of
 * GET /config/view-config and of the video performance analytics.
 */
export interface ViewCountingRules {
  /** Seconds played needed = min(duration × minWatchPercent / 100, minWatchSeconds). */
  minWatchPercent: number;
  minWatchSeconds: number;
  /** Counted views of one video by one viewer per 24-hour window. */
  maxViewsPerViewerPerVideoPerDay: number;
  repeatWindow: 'rolling_24h_from_first_counted_view';
  viewerIdentity: 'account_when_signed_in_else_network_address';
  maxNewViewsPerMinute: number;
  maxConcurrentViews: number;
  /** Always true: the creator's own views follow the ordinary signed-in rule. */
  creatorViewsCountLikeAnyViewer: true;
  /** The rule in one paragraph. */
  summary: string;
}

export interface ViewConfig {
  thresholds: ViewConfigThresholds;
  limits: ViewConfigLimits;
  updateInterval: number;  // Default: 30000 (ms)
  /** Absent only in the local defaults and in a cache written by an older build. */
  countingRules?: ViewCountingRules;
}

export interface ConfigResponse {
  success: boolean;
  data: ViewConfig;
}
/**
 * The documented defaults, mirrored from the backend's `view_threshold_*` /
 * `max_views_*` configuration. Tracking falls back to these whenever
 * `GET /config/view-config` is unavailable — a failed config fetch must degrade
 * to "track with the standard rules", never to "track nothing".
 */
export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  thresholds: {
    percentage: 30,
    seconds: 30,
  },
  limits: {
    maxViewsPerDay: 10,
    maxOwnerViews: 10,
    maxConcurrentViews: 2,
  },
  updateInterval: 30000,
};
