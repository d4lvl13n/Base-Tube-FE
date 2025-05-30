import { AxiosError } from 'axios';
import { handleApiError, retryWithBackoff, createSuccessResponse, createErrorResponse } from '../../utils/errorHandler';
import { ErrorCode } from '../../types/error';
import api from '../index';

// Mock API modules to test error handling
jest.mock('../index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

// Mock console methods to verify logging
const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('handleApiError', () => {
    it('should handle network errors correctly', () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      const result = handleApiError(networkError, {
        action: 'test network call',
        component: 'test-component'
      });

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(result.message).toContain('connection problem');
      expect(result.canRetry).toBe(true);
    });

    it('should handle 401 authentication errors correctly', () => {
      const authError = new AxiosError('Unauthorized');
      authError.response = {
        status: 401,
        data: { message: 'Token expired' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any
      };

      const result = handleApiError(authError, {
        action: 'fetch user data',
        component: 'user-profile'
      });

      expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(result.message).toContain('sign in');
    });

    it('should handle 404 not found errors correctly', () => {
      const notFoundError = new AxiosError('Not Found');
      notFoundError.response = {
        status: 404,
        data: { message: 'Resource not found' },
        statusText: 'Not Found',
        headers: {},
        config: {} as any
      };

      const result = handleApiError(notFoundError, {
        action: 'fetch video details',
        component: 'video-player'
      });

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.message).toContain('not found');
    });

    it('should handle 500 server errors correctly', () => {
      const serverError = new AxiosError('Internal Server Error');
      serverError.response = {
        status: 500,
        data: { message: 'Server error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any
      };

      const result = handleApiError(serverError, {
        action: 'upload video',
        component: 'video-upload'
      });

      expect(result.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(result.message).toContain('wrong on our end');
      expect(result.canRetry).toBe(true);
    });

    it('should include proper error structure', () => {
      const error = new AxiosError('Test Error');
      const context = {
        action: 'test action',
        component: 'test-component',
        additionalData: { userId: '123', videoId: '456' }
      };

      const result = handleApiError(error, context);

      expect(result.code).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.severity).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try when function succeeds', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(successFn, 3, 100);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry the specified number of times on failure', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(retryWithBackoff(failFn, 3, 100)).rejects.toThrow('Test error');
      expect(failFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should succeed on retry if function eventually succeeds', async () => {
      const retryFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success on third try');
      
      const result = await retryWithBackoff(retryFn, 3, 100);
      
      expect(result).toBe('success on third try');
      expect(retryFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response Helpers', () => {
    it('should create success response correctly', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.error).toBeUndefined();
    });

    it('should create error response correctly', () => {
      const response = createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Test operation failed');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.message).toBe('Test operation failed');
      expect(response.data).toBeUndefined();
    });
  });
});

describe('API Module Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics API Error Handling', () => {
    it('should return fallback data for analytics errors', async () => {
      // Mock analytics API failure
      mockApi.get.mockRejectedValue(new AxiosError('Service unavailable'));

      // Import analytics function to test
      const { getSocialMetrics } = await import('../analytics');
      
      const result = await getSocialMetrics('test-channel-id');

      // Should return fallback data structure instead of throwing
      expect(result).toEqual({
        interactions: {
          commentsReceived: 0,
          responseRate: 0,
          averageResponseTime: 0,
          recentEngagement: {
            total: 0,
            likes: 0,
            comments: 0
          }
        },
        community: {
          subscriberCount: 0,
          recentSubscribers: 0
        }
      });

      // Should log warning about fallback
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Social metrics unavailable, returning empty data')
      );
    });

    it('should retry and succeed on transient errors', async () => {
      // Mock API to fail twice then succeed
      mockApi.get
        .mockRejectedValueOnce(new AxiosError('Temporary failure'))
        .mockRejectedValueOnce(new AxiosError('Another temporary failure'))
        .mockResolvedValue({
          data: {
            success: true,
            data: {
              metrics: {
                subscribers: { total: 100, trend: 5, data: [] },
                views: { total: 1000, trend: 10, data: [] },
                engagement: { total: 50, trend: 2, data: [] }
              }
            }
          }
        });

      const { getGrowthMetrics } = await import('../analytics');
      
      const result = await getGrowthMetrics('7d', 'test-channel-id');

      // Should succeed after retries
      expect(result.metrics.subscribers.total).toBe(100);
      expect(mockApi.get).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });
  });

  describe('Video API Error Handling', () => {
    it('should handle upload errors with proper user messaging', async () => {
      const uploadError = new AxiosError('Upload failed');
      uploadError.response = {
        status: 413,
        data: { message: 'File too large' },
        statusText: 'Payload Too Large',
        headers: {},
        config: {} as any
      };

      mockApi.post.mockRejectedValue(uploadError);

      const { uploadVideo } = await import('../video');
      
      const formData = new FormData();
      formData.append('video', new Blob(['test']), 'test.mp4');

      await expect(uploadVideo(formData)).rejects.toMatchObject({
        code: ErrorCode.FILE_TOO_LARGE,
        message: expect.stringContaining('file size'),
        recoveryActions: expect.arrayContaining(['retry'])
      });
    });
  });

  describe('Authentication API Error Handling', () => {
    it('should handle wallet connection errors appropriately', async () => {
      const authError = new AxiosError('Connection failed');
      authError.code = 'NETWORK_ERROR';

      mockApi.post.mockRejectedValue(authError);

      const { default: web3AuthApi } = await import('../web3authapi');
      
      await expect(web3AuthApi.login('0x123')).rejects.toMatchObject({
        code: ErrorCode.NETWORK_ERROR,
        message: expect.stringContaining('connection'),
        recoveryActions: expect.arrayContaining(['retry', 'check_connection'])
      });
    });
  });

  describe('Content Pass API Error Handling', () => {
    it('should handle pass creation errors with proper context', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 400,
        data: { message: 'Invalid pass data' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };

      mockApi.post.mockRejectedValue(validationError);

      const { createContentPass } = await import('../pass');
      
      const passData = {
        title: 'Test Pass',
        description: 'Test description',
        price_cents: 1000,
        currency: 'USD' as const
      };

      await expect(createContentPass(passData)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: expect.stringContaining('information provided'),
        recoveryActions: expect.arrayContaining(['retry'])
      });
    });
  });
}); 