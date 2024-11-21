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