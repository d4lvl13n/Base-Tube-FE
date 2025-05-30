// src/types/error.ts
// Standardized Error Types for Task 1.2: Error Handling

/**
 * Standard API Response Interface
 * All API responses should follow this structure
 */
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * Structured Error Information
 */
export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

/**
 * Error Categories for User-Friendly Messaging
 */
export enum ErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  REQUEST_FAILED = 'REQUEST_FAILED',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Upload Errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // YouTube Integration Errors
  YOUTUBE_AUTH_ERROR = 'YOUTUBE_AUTH_ERROR',
  YOUTUBE_API_ERROR = 'YOUTUBE_API_ERROR',
  YOUTUBE_QUOTA_EXCEEDED = 'YOUTUBE_QUOTA_EXCEEDED',
  
  // Content Pass Errors
  PASS_NOT_FOUND = 'PASS_NOT_FOUND',
  PASS_EXPIRED = 'PASS_EXPIRED',
  INSUFFICIENT_ACCESS = 'INSUFFICIENT_ACCESS',
  
  // Analytics Errors
  ANALYTICS_UNAVAILABLE = 'ANALYTICS_UNAVAILABLE',
  DATA_PROCESSING_ERROR = 'DATA_PROCESSING_ERROR',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * User-Friendly Error Messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Network Errors
  [ErrorCode.NETWORK_ERROR]: 'Connection problem. Please check your internet and try again.',
  [ErrorCode.CONNECTION_TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorCode.REQUEST_FAILED]: 'Request failed. Please try again in a moment.',
  
  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCode.FORBIDDEN]: 'You don\'t have permission to access this resource.',
  
  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'Some information is invalid. Please review and try again.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  
  // Resource Errors
  [ErrorCode.NOT_FOUND]: 'The requested item could not be found.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource is not available.',
  [ErrorCode.CHANNEL_NOT_FOUND]: 'Channel not found. It may have been removed or made private.',
  [ErrorCode.VIDEO_NOT_FOUND]: 'Video not found. It may have been removed or made private.',
  
  // Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [ErrorCode.DATABASE_ERROR]: 'Data access error. Please try again in a moment.',
  
  // Upload Errors
  [ErrorCode.UPLOAD_FAILED]: 'Upload failed. Please check your file and try again.',
  [ErrorCode.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Please choose a supported format.',
  
  // YouTube Integration Errors
  [ErrorCode.YOUTUBE_AUTH_ERROR]: 'YouTube connection failed. Please reconnect your account.',
  [ErrorCode.YOUTUBE_API_ERROR]: 'YouTube service error. Please try again later.',
  [ErrorCode.YOUTUBE_QUOTA_EXCEEDED]: 'YouTube API limit reached. Please try again tomorrow.',
  
  // Content Pass Errors
  [ErrorCode.PASS_NOT_FOUND]: 'Content pass not found or no longer available.',
  [ErrorCode.PASS_EXPIRED]: 'This content pass has expired.',
  [ErrorCode.INSUFFICIENT_ACCESS]: 'You need to purchase this content pass to access this content.',
  
  // Analytics Errors
  [ErrorCode.ANALYTICS_UNAVAILABLE]: 'Analytics data is temporarily unavailable.',
  [ErrorCode.DATA_PROCESSING_ERROR]: 'Unable to process data. Please try again later.',
  
  // General Errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.'
};

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'low',          // Minor issues, user can continue
  MEDIUM = 'medium',    // Notable issues, some functionality affected
  HIGH = 'high',        // Major issues, core functionality affected
  CRITICAL = 'critical' // Critical issues, app might be unusable
}

/**
 * Error Recovery Actions
 */
export interface ErrorRecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

/**
 * Enhanced Error Interface for Components
 */
export interface UserFacingError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  recoveryActions?: ErrorRecoveryAction[];
  canRetry?: boolean;
  retryAction?: () => void;
  timestamp: Date;
}

/**
 * Error Context for Debugging
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
} 