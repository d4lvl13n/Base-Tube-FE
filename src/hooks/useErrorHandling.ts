// src/hooks/useErrorHandling.ts
// Demo Hook for Task 1.2: Error Handling System

import { useState, useCallback } from 'react';
import { UserFacingError } from '../types/error';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';

interface UseErrorHandlingReturn {
  error: UserFacingError | null;
  isLoading: boolean;
  clearError: () => void;
  executeWithErrorHandling: <T>(
    apiCall: () => Promise<T>,
    context?: string
  ) => Promise<T | null>;
}

/**
 * Hook for managing API errors with user-friendly error handling
 * 
 * @example
 * const { error, isLoading, clearError, executeWithErrorHandling } = useErrorHandling();
 * 
 * const handleUpload = async () => {
 *   const result = await executeWithErrorHandling(
 *     () => uploadVideo(formData),
 *     'video upload'
 *   );
 *   if (result) {
 *     // Handle success
 *   }
 * };
 */
export const useErrorHandling = (): UseErrorHandlingReturn => {
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    apiCall: () => Promise<T>,
    context: string = 'API request'
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Execute with retry logic
      const result = await retryWithBackoff(apiCall, 2, 1000);
      return result;
    } catch (originalError) {
      // Handle error with our centralized system
      const userError = handleApiError(originalError, {
        action: context,
        component: 'useErrorHandling',
        url: window.location.href
      });

      // Set retry action if the error supports retry
      if (userError.canRetry) {
        userError.retryAction = () => {
          executeWithErrorHandling(apiCall, context);
        };
      }

      setError(userError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    error,
    isLoading,
    clearError,
    executeWithErrorHandling
  };
};

/**
 * Convenience hook for common API operations with standardized error handling
 */
export const useApiRequest = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) => {
  const { error, isLoading, clearError, executeWithErrorHandling } = useErrorHandling();
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    const result = await executeWithErrorHandling(apiCall, 'API request');
    if (result) {
      setData(result);
    }
  }, [apiCall, executeWithErrorHandling]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    error,
    isLoading,
    execute,
    retry,
    clearError
  };
}; 