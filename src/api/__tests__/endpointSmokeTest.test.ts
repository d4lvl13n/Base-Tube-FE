/**
 * Smoke Tests for API Endpoints with Error Handling
 * These tests verify that our error handling works correctly across different scenarios
 */

import { AxiosError } from 'axios';

// Mock the API base module
jest.mock('../index');

describe('API Endpoints Smoke Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Analytics API', () => {
    it('should handle successful analytics requests', async () => {
      // Mock successful API response
      const mockGet = jest.fn().mockResolvedValue({
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

      // Import and mock the API
      jest.doMock('../index', () => ({ get: mockGet }));
      const { getSocialMetrics } = await import('../analytics');
      
      const result = await getSocialMetrics('channel-123');
      
      expect(result.interactions.commentsReceived).toBe(10);
      expect(result.community.subscriberCount).toBe(1000);
      expect(mockGet).toHaveBeenCalledWith(
        '/api/v1/analytics/channels/channel-123/social-metrics'
      );
    });

    it('should return fallback data when analytics service is unavailable', async () => {
      // Mock API failure
      const mockGet = jest.fn().mockRejectedValue(new AxiosError('Service Unavailable'));
      jest.doMock('../index', () => ({ get: mockGet }));
      
      const { getSocialMetrics } = await import('../analytics');
      
      const result = await getSocialMetrics('channel-123');
      
      // Should return fallback data instead of throwing
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
    });

    it('should retry and eventually succeed for transient failures', async () => {
      // Mock API to fail twice then succeed
      const mockGet = jest.fn()
        .mockRejectedValueOnce(new AxiosError('Temporary failure'))
        .mockRejectedValueOnce(new AxiosError('Another failure'))
        .mockResolvedValue({
          data: {
            success: true,
            data: {
              hourlyPatterns: [{ hour: 14, viewCount: 100, avgWatchSeconds: 300 }],
              weekdayPatterns: [{ dayOfWeek: 1, viewCount: 500 }],
              durationStats: {
                averageWatchDuration: 250,
                maxWatchDuration: 600,
                totalViews: 1000,
                uniqueViewers: 800
              },
              retentionByDuration: [],
              topRetainedVideos: []
            }
          }
        });

      jest.doMock('../index', () => ({ get: mockGet }));
      const { getChannelWatchPatterns } = await import('../analytics');
      
      const result = await getChannelWatchPatterns('channel-123');
      
      expect(result.hourlyPatterns).toHaveLength(1);
      expect(result.durationStats.totalViews).toBe(1000);
      expect(mockGet).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });
  });

  describe('Video API', () => {
    it('should handle successful video operations', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: {
          id: 'video-123',
          message: 'Upload successful',
          video_path: '/videos/video-123.mp4',
          thumbnail_path: '/thumbnails/video-123.jpg'
        }
      });

      jest.doMock('../index', () => ({ post: mockPost }));
      const { uploadVideo } = await import('../video');
      
      const formData = new FormData();
      formData.append('video', new Blob(['test']), 'test.mp4');
      formData.append('title', 'Test Video');
      
      const result = await uploadVideo(formData);
      
      // uploadVideo returns full axios response, so result.data contains the upload data
      expect(result.data.id).toBe('video-123');
      expect(result.data.message).toBe('Upload successful');
      expect(mockPost).toHaveBeenCalledWith('/api/v1/videos/upload', formData, expect.any(Object));
    });

    it('should handle file size errors appropriately', async () => {
      const fileSizeError = new AxiosError('File too large');
      fileSizeError.response = {
        status: 413,
        data: { message: 'File exceeds maximum size' },
        statusText: 'Payload Too Large',
        headers: {},
        config: {} as any
      };

      const mockPost = jest.fn().mockRejectedValue(fileSizeError);
      jest.doMock('../index', () => ({ post: mockPost }));
      
      const { uploadVideo } = await import('../video');
      
      const formData = new FormData();
      formData.append('video', new Blob(['test']), 'test.mp4');
      
      await expect(uploadVideo(formData)).rejects.toMatchObject({
        message: expect.stringContaining('file size'),
        code: 'FILE_TOO_LARGE'
      });
    });
  });

  describe('Authentication API', () => {
    it('should handle successful wallet authentication', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          token: 'jwt-token-123',
          user: { 
            id: '1', 
            username: 'testuser',
            email: 'test@example.com',
            name: 'Test User',
            profile_image_url: 'https://example.com/profile.jpg',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            onboarding_status: 'COMPLETED' as const,
            web3auth: { 
              id: 1,
              user_id: '1',
              wallet_address: '0x123',
              last_login: null,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            }
          }
        }
      });

      jest.doMock('../index', () => ({ post: mockPost }));
      const { default: web3AuthApi } = await import('../web3authapi');
      
      const result = await web3AuthApi.login('0x123456789');
      
      // web3authapi.login returns response.data directly, which should be LoginResponse
      expect(result.token).toBe('jwt-token-123');
      expect(result.user.web3auth?.wallet_address).toBe('0x123');
    });

    it('should handle network errors during authentication', async () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';

      const mockPost = jest.fn().mockRejectedValue(networkError);
      jest.doMock('../index', () => ({ post: mockPost }));
      
      const { default: web3AuthApi } = await import('../web3authapi');
      
      await expect(web3AuthApi.login('0x123456789')).rejects.toMatchObject({
        message: expect.stringContaining('connection'),
        code: 'NETWORK_ERROR'
      });
    });
  });

  describe('Content Pass API', () => {
    it('should handle successful pass creation', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: '456',
            title: 'Premium Content Pass',
            price_cents: 1000,
            currency: 'USD',
            formatted_price: '$10.00',
            tier: 'bronze',
            description: 'Access to exclusive content',
            channel: {
              name: 'Test Channel',
              user: { username: 'testuser' }
            },
            videos: []
          }
        }
      });

      jest.doMock('../index', () => ({ post: mockPost }));
      const { createContentPass } = await import('../pass');
      
      const passData = {
        title: 'Premium Content Pass',
        description: 'Access to exclusive content',
        price_cents: 1000,
        currency: 'USD'
      };
      
      const result = await createContentPass(passData);
      
      expect(result.data.id).toBe('456');
      expect(result.data.title).toBe('Premium Content Pass');
    });

    it('should handle validation errors with helpful messages', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 400,
        data: { message: 'Price must be positive' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };

      const mockPost = jest.fn().mockRejectedValue(validationError);
      jest.doMock('../index', () => ({ post: mockPost }));
      
      const { createContentPass } = await import('../pass');
      
      const invalidPassData = {
        title: 'Test Pass',
        description: 'Test',
        price_cents: -500, // Invalid negative price
        currency: 'USD'
      };
      
      await expect(createContentPass(invalidPassData)).rejects.toMatchObject({
        message: expect.stringContaining('information provided'),
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('Share API', () => {
    it('should handle successful share tracking', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 789,
            videoId: 123,
            platform: 'twitter',
            createdAt: new Date().toISOString()
          }
        }
      });

      jest.doMock('../index', () => ({ post: mockPost }));
      const { recordVideoShare } = await import('../shareApi');
      
      const result = await recordVideoShare('123', 'twitter');
      
      expect(result.data.videoId).toBe(123);
      expect(result.data.platform).toBe('twitter');
    });

    it('should gracefully handle share tracking failures', async () => {
      const trackingError = new AxiosError('Tracking service down');
      const mockPost = jest.fn().mockRejectedValue(trackingError);
      
      jest.doMock('../index', () => ({ post: mockPost }));
      const { recordVideoShare } = await import('../shareApi');
      
      // Should not throw, but return fallback response
      const result = await recordVideoShare('123', 'twitter');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Share tracking failed');
      expect(result.data.platform).toBe('twitter');
    });
  });
});

describe('Error Recovery Patterns', () => {
  it('should demonstrate the complete error handling flow', async () => {
    // Simulate a complete error scenario with recovery
    const networkError = new AxiosError('Connection timeout');
    networkError.code = 'ECONNABORTED';
    
    const mockGet = jest.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue({
        data: {
          success: true,
          data: {
            interactions: { commentsReceived: 5, responseRate: 90, averageResponseTime: 1.5, recentEngagement: { total: 25, likes: 15, comments: 10 } },
            community: { subscriberCount: 500, recentSubscribers: 10 }
          }
        }
      });

    jest.doMock('../index', () => ({ get: mockGet }));
    const { getSocialMetrics } = await import('../analytics');
    
    // Should succeed after retry
    const result = await getSocialMetrics('channel-123');
    
    expect(result.interactions.commentsReceived).toBe(5);
    expect(mockGet).toHaveBeenCalledTimes(2); // 1 failure + 1 success
  });
}); 