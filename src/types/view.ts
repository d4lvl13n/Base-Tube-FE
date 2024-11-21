export interface ViewConfig {
  thresholds: {
    percentage: number;
    seconds: number;
  };
  limits: {
    maxViewsPerDay: number;
    maxOwnerViews: number;
    maxConcurrentViews: number;
  };
  updateInterval: number;
}

export interface ViewResponse {
  success: boolean;
  data?: {
    totalViews: number;
    isNewView: boolean;
  };
  message?: string;
}

export interface ViewError {
  success: false;
  message: 
    | "Watch duration does not meet view threshold"
    | "Maximum views reached for this video"
    | "Watch duration cannot exceed video duration"
    | "View validation failed"
    | "Video duration not properly set"
    | "Rate limit exceeded"
    | "Maximum concurrent views reached"
    | "Video not found"
    | "Invalid video duration"
    | "Invalid watched duration"
    | "Authentication required"
    | "Invalid IP address format"
    | "Invalid IP address range";
}

export interface ViewValidationResults {
  isValidIP: boolean;
  isValidPattern: boolean;
  isValidConcurrent: boolean;
}

export interface ViewRequestBody {
  watchedDuration: number;
}

export interface InitViewResponse {
  success: boolean;
  message: string;
  data: {
    viewId: string;
  }
}

export interface UpdateViewRequest {
  watchedDuration: number;
  completed?: boolean;
}

export interface UpdateViewResponse {
  success: boolean;
  message: string;
}