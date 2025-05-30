/**
 * Comprehensive API Integration Tests
 * These tests verify that our APIs work correctly with error handling
 * and that we didn't break any imports or functionality
 */

import { AxiosError } from 'axios';
import { ErrorCode } from '../../types/error';

// Mock the API base module 
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('../index', () => ({
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete
}));

describe('API Integration Tests - Verifying All Endpoints Work', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Analytics API - Import and Function Verification', () => {
    it('should import analytics functions without errors', async () => {
      const analyticsModule = await import('../analytics');
      
      // Verify all expected functions are exported
      expect(typeof analyticsModule.getSocialMetrics).toBe('function');
      expect(typeof analyticsModule.getChannelWatchPatterns).toBe('function');
      expect(typeof analyticsModule.getGrowthMetrics).toBe('function');
      expect(typeof analyticsModule.getChannelViewMetrics).toBe('function');
      expect(typeof analyticsModule.getChannelWatchHours).toBe('function');
      expect(typeof analyticsModule.getEngagementTrends).toBe('function');
    });

    it('should handle successful getSocialMetrics call', async () => {
      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            interactions: {
              commentsReceived: 10,
              responseRate: 85,
              averageResponseTime: 2,
              recentEngagement: { total: 50, likes: 30, comments: 20 }
            },
            community: {
              subscriberCount: 1000,
              recentSubscribers: 25
            }
          }
        }
      });

      const { getSocialMetrics } = await import('../analytics');
      const result = await getSocialMetrics('test-channel');
      
      expect(result.interactions.commentsReceived).toBe(10);
      expect(result.community.subscriberCount).toBe(1000);
      expect(mockGet).toHaveBeenCalledWith('/api/v1/analytics/channels/test-channel/social-metrics');
    });

    it('should handle analytics errors with fallback data', async () => {
      mockGet.mockRejectedValue(new AxiosError('Service unavailable'));

      const { getSocialMetrics } = await import('../analytics');
      const result = await getSocialMetrics('test-channel');
      
      // Should return fallback data instead of throwing
      expect(result.interactions.commentsReceived).toBe(0);
      expect(result.community.subscriberCount).toBe(0);
    });
  });

  describe('Video API - Import and Function Verification', () => {
    it('should import video functions without errors', async () => {
      const videoModule = await import('../video');
      
      // Test functions that actually exist
      expect(typeof videoModule.uploadVideo).toBe('function');
      expect(typeof videoModule.getRecommendedVideos).toBe('function');
      expect(typeof videoModule.toggleVideoLike).toBe('function');
      expect(typeof videoModule.getVideoLikeStatus).toBe('function');
      expect(typeof videoModule.getAllVideos).toBe('function');
      expect(typeof videoModule.getTrendingVideos).toBe('function');
    });

    it('should handle successful video upload', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'video-123',
            message: 'Upload successful',
            video_path: '/videos/video-123.mp4',
            thumbnail_path: '/thumbnails/video-123.jpg'
          }
        }
      });

      const { uploadVideo } = await import('../video');
      
      const formData = new FormData();
      formData.append('video', new Blob(['test']), 'test.mp4');
      
      const result = await uploadVideo(formData);
      
      expect(result.data.id).toBe('video-123');
      expect(result.data.message).toBe('Upload successful');
      expect(mockPost).toHaveBeenCalledWith('/api/v1/videos/upload', formData, expect.any(Object));
    });

    it('should handle upload errors correctly', async () => {
      const fileSizeError = new AxiosError('File too large');
      fileSizeError.response = {
        status: 413,
        data: { message: 'File exceeds maximum size' },
        statusText: 'Payload Too Large',
        headers: {},
        config: {} as any
      };

      mockPost.mockRejectedValue(fileSizeError);

      const { uploadVideo } = await import('../video');
      
      const formData = new FormData();
      formData.append('video', new Blob(['test']), 'test.mp4');
      
      await expect(uploadVideo(formData)).rejects.toMatchObject({
        code: ErrorCode.FILE_TOO_LARGE,
        message: expect.stringContaining('file size')
      });
    });
  });

  describe('Channel API - Import and Function Verification', () => {
    it('should import channel functions without errors', async () => {
      const channelModule = await import('../channel');
      
      expect(typeof channelModule.getMyChannels).toBe('function');
      expect(typeof channelModule.getChannelById).toBe('function');
      expect(typeof channelModule.createChannel).toBe('function');
    });

    it('should handle successful channel operations', async () => {
      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              id: 'channel-123',
              name: 'Test Channel',
              user: { username: 'testuser' }
            }
          ]
        }
      });

      const { getMyChannels } = await import('../channel');
      const result = await getMyChannels();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('channel-123');
      expect(result[0].name).toBe('Test Channel');
    });
  });

  describe('Web3Auth API - Import and Function Verification', () => {
    it('should import web3auth functions without errors', async () => {
      const web3AuthModule = await import('../web3authapi');
      
      expect(typeof web3AuthModule.default.login).toBe('function');
      expect(typeof web3AuthModule.default.signup).toBe('function');
      expect(typeof web3AuthModule.default.linkWallet).toBe('function');
    });

    it('should handle successful authentication', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              username: 'testuser',
              web3auth: { wallet_address: '0x123' }
            },
            token: 'jwt-token-123'
          }
        }
      });

      const { default: web3AuthApi } = await import('../web3authapi');
      const result = await web3AuthApi.login('0x123456789');
      
      expect(result.user.id).toBe('user-123');
      expect(result.token).toBe('jwt-token-123');
    });

    it('should handle authentication errors', async () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';

      mockPost.mockRejectedValue(networkError);

      const { default: web3AuthApi } = await import('../web3authapi');
      
      await expect(web3AuthApi.login('0x123456789')).rejects.toMatchObject({
        code: ErrorCode.NETWORK_ERROR,
        message: expect.stringContaining('connection')
      });
    });
  });

  describe('Content Pass API - Import and Function Verification', () => {
    it('should import pass functions without errors', async () => {
      const passModule = await import('../pass');
      
      // Test functions that actually exist
      expect(typeof passModule.createContentPass).toBe('function');
      expect(typeof passModule.purchaseContentPass).toBe('function');
      expect(typeof passModule.getUserPasses).toBe('function');
      expect(typeof passModule.checkPassAccess).toBe('function');
    });

    it('should handle successful pass creation', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'pass-123',
            title: 'Premium Content Pass',
            price_cents: 1000,
            currency: 'USD'
          }
        }
      });

      const { createContentPass } = await import('../pass');
      
      const passData = {
        title: 'Premium Content Pass',
        description: 'Access to exclusive content',
        price_cents: 1000,
        currency: 'USD'
      };
      
      const result = await createContentPass(passData);
      
      expect(result.data.id).toBe('pass-123');
      expect(result.data.title).toBe('Premium Content Pass');
    });

    it('should handle pass validation errors', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 400,
        data: { message: 'Price must be positive' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };

      mockPost.mockRejectedValue(validationError);

      const { createContentPass } = await import('../pass');
      
      const invalidPassData = {
        title: 'Test Pass',
        description: 'Test',
        price_cents: -500, // Invalid negative price
        currency: 'USD'
      };
      
      await expect(createContentPass(invalidPassData)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: expect.stringContaining('information provided')
      });
    });
  });

  describe('Share API - Import and Function Verification', () => {
    it('should import share functions without errors', async () => {
      const shareModule = await import('../shareApi');
      
      // Test functions that actually exist
      expect(typeof shareModule.recordVideoShare).toBe('function');
      expect(typeof shareModule.getVideoShareStats).toBe('function');
    });

    it('should handle successful share tracking', async () => {
      mockPost.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'share-123',
            videoId: 123,
            platform: 'twitter',
            createdAt: new Date().toISOString()
          }
        }
      });

      const { recordVideoShare } = await import('../shareApi');
      const result = await recordVideoShare('123', 'twitter');
      
      expect(result.data.videoId).toBe(123);
      expect(result.data.platform).toBe('twitter');
    });

    it('should handle share tracking failures gracefully', async () => {
      const trackingError = new AxiosError('Tracking service down');
      mockPost.mockRejectedValue(trackingError);

      const { recordVideoShare } = await import('../shareApi');
      
      // Should not throw, but return fallback response
      const result = await recordVideoShare('123', 'twitter');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Share tracking failed');
      expect(result.data.platform).toBe('twitter');
    });
  });

  describe('Cross-Module Integration', () => {
    it('should handle multiple API calls without conflicts', async () => {
      // Set up different responses for different endpoints
      mockGet
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              interactions: { commentsReceived: 5, responseRate: 80, averageResponseTime: 1, recentEngagement: { total: 20, likes: 10, comments: 10 } },
              community: { subscriberCount: 500, recentSubscribers: 15 }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: [{ id: 'channel-456', name: 'Another Channel', user: { username: 'user2' } }]
          }
        });

      const { getSocialMetrics } = await import('../analytics');
      const { getMyChannels } = await import('../channel');
      
      // Call both APIs
      const [socialMetrics, channels] = await Promise.all([
        getSocialMetrics('test-channel'),
        getMyChannels()
      ]);
      
      expect(socialMetrics.interactions.commentsReceived).toBe(5);
      expect(channels).toHaveLength(1);
      expect(channels[0].id).toBe('channel-456');
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Analytics succeeds, channel fails
      mockGet
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              interactions: { commentsReceived: 8, responseRate: 90, averageResponseTime: 2, recentEngagement: { total: 30, likes: 20, comments: 10 } },
              community: { subscriberCount: 800, recentSubscribers: 20 }
            }
          }
        })
        .mockRejectedValueOnce(new AxiosError('Channel service unavailable'));

      const { getSocialMetrics } = await import('../analytics');
      const { getMyChannels } = await import('../channel');
      
      const [socialMetrics, channelsResult] = await Promise.allSettled([
        getSocialMetrics('test-channel'),
        getMyChannels()
      ]);
      
      expect(socialMetrics.status).toBe('fulfilled');
      expect(channelsResult.status).toBe('rejected');
      
      // Fix conditional expect
      expect(socialMetrics).toMatchObject({
        status: 'fulfilled',
        value: expect.objectContaining({
          interactions: expect.objectContaining({
            commentsReceived: 8
          })
        })
      });
    });
  });
});

describe('Error Handling Core Functions', () => {
  it('should handle retryWithBackoff correctly', async () => {
    const { retryWithBackoff } = await import('../../utils/errorHandler');
    
    // Test successful retry
    const retryFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(retryFn, 2, 50);
    
    expect(result).toBe('success');
    expect(retryFn).toHaveBeenCalledTimes(2);
  });

  it('should create proper success and error responses', async () => {
    const { createSuccessResponse, createErrorResponse } = await import('../../utils/errorHandler');
    
    const successResponse = createSuccessResponse({ id: 1, name: 'Test' }, 'Operation successful');
    expect(successResponse.success).toBe(true);
    expect(successResponse.data?.id).toBe(1);
    expect(successResponse.message).toBe('Operation successful');
    
    const errorResponse = createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed');
    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
}); 