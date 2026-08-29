export interface ViewConfigThresholds {
  percentage: number;  // Default: 30 (%)
  seconds: number;    // Default: 30 (seconds)
}

export interface ViewConfigLimits {
  maxViewsPerDay: number;      // Default: 10
  maxOwnerViews: number;       // Default: 5
  maxConcurrentViews: number;  // Default: 3
}

export interface ViewConfig {
  thresholds: ViewConfigThresholds;
  limits: ViewConfigLimits;
  updateInterval: number;  // Default: 30000 (ms)
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
    maxOwnerViews: 5,
    maxConcurrentViews: 3,
  },
  updateInterval: 30000,
};
