// src/utils/errorHandler.ts
// Centralized Error Handling for Task 1.2: Error Handling

import axios, { AxiosError } from 'axios';
import { 
  ErrorCode, 
  ErrorMessages, 
  ErrorSeverity, 
  UserFacingError, 
  ErrorContext, 
  StandardApiResponse,
  ApiError 
} from '../types/error';

/**
 * ApiErrorHandler - Centralized error handling utility
 */
export class ApiErrorHandler {
  /**
   * Maps HTTP status codes to error codes
   */
  private static statusCodeMap: Record<number, ErrorCode> = {
    400: ErrorCode.VALIDATION_ERROR,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    408: ErrorCode.CONNECTION_TIMEOUT,
    409: ErrorCode.VALIDATION_ERROR,
    422: ErrorCode.INVALID_INPUT,
    429: ErrorCode.AUTH_RATE_LIMIT,
    500: ErrorCode.INTERNAL_SERVER_ERROR,
    502: ErrorCode.SERVICE_UNAVAILABLE,
    503: ErrorCode.SERVICE_UNAVAILABLE,
    504: ErrorCode.CONNECTION_TIMEOUT
  };

  /**
   * Maps error codes to severity levels
   */
  private static severityMap: Record<ErrorCode, ErrorSeverity> = {
    [ErrorCode.NETWORK_ERROR]: ErrorSeverity.HIGH,
    [ErrorCode.CONNECTION_TIMEOUT]: ErrorSeverity.MEDIUM,
    [ErrorCode.REQUEST_FAILED]: ErrorSeverity.MEDIUM,
    [ErrorCode.UNAUTHORIZED]: ErrorSeverity.HIGH,
    [ErrorCode.TOKEN_EXPIRED]: ErrorSeverity.HIGH,
    [ErrorCode.FORBIDDEN]: ErrorSeverity.MEDIUM,
    [ErrorCode.AUTH_RATE_LIMIT]: ErrorSeverity.HIGH,
    [ErrorCode.NO_AUTH_TOKEN]: ErrorSeverity.HIGH,
    [ErrorCode.INVALID_TOKEN_FORMAT]: ErrorSeverity.HIGH,
    [ErrorCode.TOKEN_FROM_FUTURE]: ErrorSeverity.MEDIUM,
    [ErrorCode.CORS_ERROR]: ErrorSeverity.HIGH,
    [ErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
    [ErrorCode.INVALID_INPUT]: ErrorSeverity.LOW,
    [ErrorCode.MISSING_REQUIRED_FIELD]: ErrorSeverity.LOW,
    [ErrorCode.NOT_FOUND]: ErrorSeverity.MEDIUM,
    [ErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.MEDIUM,
    [ErrorCode.CHANNEL_NOT_FOUND]: ErrorSeverity.MEDIUM,
    [ErrorCode.VIDEO_NOT_FOUND]: ErrorSeverity.MEDIUM,
    [ErrorCode.INTERNAL_SERVER_ERROR]: ErrorSeverity.CRITICAL,
    [ErrorCode.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
    [ErrorCode.DATABASE_ERROR]: ErrorSeverity.CRITICAL,
    [ErrorCode.UPLOAD_FAILED]: ErrorSeverity.MEDIUM,
    [ErrorCode.FILE_TOO_LARGE]: ErrorSeverity.LOW,
    [ErrorCode.INVALID_FILE_TYPE]: ErrorSeverity.LOW,
    [ErrorCode.YOUTUBE_AUTH_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCode.YOUTUBE_API_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCode.YOUTUBE_QUOTA_EXCEEDED]: ErrorSeverity.HIGH,
    [ErrorCode.PASS_NOT_FOUND]: ErrorSeverity.MEDIUM,
    [ErrorCode.PASS_EXPIRED]: ErrorSeverity.MEDIUM,
    [ErrorCode.INSUFFICIENT_ACCESS]: ErrorSeverity.MEDIUM,
    [ErrorCode.ANALYTICS_UNAVAILABLE]: ErrorSeverity.LOW,
    [ErrorCode.DATA_PROCESSING_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCode.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.HIGH
  };

  /**
   * Handles API errors and returns user-facing error object
   */
  static handleApiError(
    error: unknown, 
    context: ErrorContext = {},
    retryAction?: () => void
  ): UserFacingError {
    console.error('API Error:', error, 'Context:', context);

    let errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR;
    let technicalMessage = 'Unknown error occurred';
    let details: any = null;

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardApiResponse>;
      
      // Check if server returned structured error response
      if (axiosError.response?.data?.error) {
        const apiError = axiosError.response.data.error;
        errorCode = this.mapStringToErrorCode(apiError.code);
        technicalMessage = apiError.message;
        details = apiError.details;
      } else {
        // Map HTTP status to error code
        const status = axiosError.response?.status;
        if (status && this.statusCodeMap[status]) {
          errorCode = this.statusCodeMap[status];
        }
        
        technicalMessage = axiosError.message;
        
        // Handle specific error cases
        if (!axiosError.response) {
          errorCode = ErrorCode.NETWORK_ERROR;
          technicalMessage = 'Network error - no response received';
        } else if (axiosError.code === 'ECONNABORTED') {
          errorCode = ErrorCode.CONNECTION_TIMEOUT;
          technicalMessage = 'Request timeout';
        }
      }
    }
    // Handle Error objects
    else if (error instanceof Error) {
      technicalMessage = error.message;
      
      // Map common error messages to codes
      if (error.message.toLowerCase().includes('network')) {
        errorCode = ErrorCode.NETWORK_ERROR;
      } else if (error.message.toLowerCase().includes('timeout')) {
        errorCode = ErrorCode.CONNECTION_TIMEOUT;
      } else if (error.message.toLowerCase().includes('unauthorized')) {
        errorCode = ErrorCode.UNAUTHORIZED;
      }
    }
    // Handle string errors
    else if (typeof error === 'string') {
      technicalMessage = error;
    }

    // Build user-facing error
    const userFacingError: UserFacingError = {
      code: errorCode,
      message: ErrorMessages[errorCode],
      severity: this.severityMap[errorCode] || ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      canRetry: this.canRetry(errorCode),
      retryAction
    };

    // Add recovery actions based on error type
    userFacingError.recoveryActions = this.getRecoveryActions(errorCode, retryAction);

    // Log error for debugging
    this.logError(error, context, userFacingError);

    return userFacingError;
  }

  /**
   * Maps string error codes to ErrorCode enum
   */
  private static mapStringToErrorCode(code: string): ErrorCode {
    // Convert to uppercase and check if it exists in ErrorCode enum
    const upperCode = code.toUpperCase() as ErrorCode;
    if (Object.values(ErrorCode).includes(upperCode)) {
      return upperCode;
    }
    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Determines if an error type supports retry
   */
  private static canRetry(errorCode: ErrorCode): boolean {
    const retryableErrors = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.CONNECTION_TIMEOUT,
      ErrorCode.REQUEST_FAILED,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.DATABASE_ERROR,
      ErrorCode.UPLOAD_FAILED,
      ErrorCode.ANALYTICS_UNAVAILABLE,
      ErrorCode.DATA_PROCESSING_ERROR
    ];
    
    return retryableErrors.includes(errorCode);
  }

  /**
   * Gets appropriate recovery actions for error type
   */
  private static getRecoveryActions(
    errorCode: ErrorCode, 
    retryAction?: () => void
  ) {
    const actions = [];

    // Add retry action if applicable
    if (this.canRetry(errorCode) && retryAction) {
      actions.push({
        label: 'Try Again',
        action: retryAction,
        primary: true
      });
    }

    // Add specific recovery actions based on error type
    switch (errorCode) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.TOKEN_EXPIRED:
        actions.push({
          label: 'Sign In',
          action: () => window.location.href = '/sign-in'
        });
        break;
        
      case ErrorCode.NETWORK_ERROR:
        actions.push({
          label: 'Check Connection',
          action: () => window.open('https://www.google.com', '_blank')
        });
        break;
        
      case ErrorCode.YOUTUBE_AUTH_ERROR:
        actions.push({
          label: 'Reconnect YouTube',
          action: () => window.location.href = '/creator-hub/channels'
        });
        break;
        
      case ErrorCode.PASS_NOT_FOUND:
      case ErrorCode.INSUFFICIENT_ACCESS:
        actions.push({
          label: 'Browse Passes',
          action: () => window.location.href = '/discover'
        });
        break;
    }

    return actions.length > 0 ? actions : undefined;
  }

  /**
   * Logs error information for debugging and monitoring
   */
  private static logError(
    originalError: unknown, 
    context: ErrorContext, 
    userFacingError: UserFacingError
  ) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      userFacingError,
      context,
      originalError: {
        message: originalError instanceof Error ? originalError.message : String(originalError),
        stack: originalError instanceof Error ? originalError.stack : undefined,
        name: originalError instanceof Error ? originalError.name : 'Unknown'
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_id') || 'anonymous'
    };

    // Console log for development
    console.group('🚨 Error Handler');
    console.error('User-facing error:', userFacingError);
    console.error('Original error:', originalError);
    console.error('Context:', context);
    console.groupEnd();

    // TODO: Send to monitoring service in production
    // if (process.env.NODE_ENV === 'production') {
    //   sendToMonitoringService(errorLog);
    // }
  }

  /**
   * Creates a standardized API error response
   */
  static createApiError(
    code: ErrorCode,
    technicalMessage: string,
    details?: any
  ): ApiError {
    return {
      code,
      message: technicalMessage,
      userMessage: ErrorMessages[code],
      details,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  /**
   * Generates a unique request ID for error tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Convenience function for handling API errors in try-catch blocks
 */
export const handleApiError = (
  error: unknown, 
  context: string | ErrorContext = {},
  retryAction?: () => void
): UserFacingError => {
  const errorContext: ErrorContext = typeof context === 'string' 
    ? { action: context }
    : context;
    
  return ApiErrorHandler.handleApiError(error, errorContext, retryAction);
};

/**
 * Convenience function for creating standardized API responses
 */
export const createSuccessResponse = <T>(data: T, message?: string): StandardApiResponse<T> => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (
  code: ErrorCode,
  technicalMessage: string,
  details?: any
): StandardApiResponse => ({
  success: false,
  error: ApiErrorHandler.createApiError(code, technicalMessage, details)
});

/**
 * Retry utility with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}; 