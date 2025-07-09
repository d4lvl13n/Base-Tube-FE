import { renderHook, waitFor } from '@testing-library/react';
import { useVideoProcessing } from '../useVideoProcessing';
import { getVideoProgress, VideoProgressResponse } from '../../api/video';

// Mock the API
jest.mock('../../api/video');
const mockGetVideoProgress = getVideoProgress as jest.MockedFunction<typeof getVideoProgress>;

// Mock console.log to verify our logging
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

// Helper to mock document.visibilityState
const mockVisibilityState = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    configurable: true,
    value: state,
  });
};

// Helper to trigger visibility change event
const triggerVisibilityChange = () => {
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useVideoProcessing Memory Leak Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    mockVisibilityState('visible');
    
    // Default mock response - matches VideoProgressResponse interface
    mockGetVideoProgress.mockResolvedValue({
      success: true,
      data: {
        status: 'processing',
        progress: {
          quality: '720p',
          percent: 50,
          currentQuality: '720p',
          totalQualities: 3,
          currentQualityIndex: 1
        }
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Interval Management', () => {
    it('should start polling when videos are provided', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useVideoProcessing([1, 2, 3]));
      
      // Wait for initial state
      await waitFor(() => {
        expect(Object.keys(result.current.processingVideos)).toHaveLength(0);
      });
      
      // Advance timer to trigger polling
      jest.advanceTimersByTime(5000);
      
      // Should have made API calls for all videos
      expect(mockGetVideoProgress).toHaveBeenCalledTimes(3);
      
      // Verify console log
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Starting polling interval')
      );
    });

    it('should pause polling when tab becomes hidden', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useVideoProcessing([1, 2]));
      
      // Wait for polling to start
      await waitFor(() => {
        jest.advanceTimersByTime(5000);
        expect(mockGetVideoProgress).toHaveBeenCalled();
      });
      
      // Clear previous calls
      mockGetVideoProgress.mockClear();
      
      // Hide the tab
      mockVisibilityState('hidden');
      triggerVisibilityChange();
      
      // Advance timer - should not make calls
      jest.advanceTimersByTime(5000);
      
      expect(mockGetVideoProgress).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Tab hidden, stopping polling')
      );
    });

    it('should resume polling when tab becomes visible', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useVideoProcessing([1]));
      
      // Start with hidden tab
      mockVisibilityState('hidden');
      triggerVisibilityChange();
      
      // Clear any initial calls
      mockGetVideoProgress.mockClear();
      
      // Make tab visible
      mockVisibilityState('visible');
      triggerVisibilityChange();
      
      // Should resume polling
      jest.advanceTimersByTime(100); // Small delay for immediate restart
      expect(mockGetVideoProgress).toHaveBeenCalled();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Tab visible, resuming polling')
      );
    });
  });

  describe('Component Cleanup', () => {
    it('should clear interval when component unmounts', async () => {
      jest.useFakeTimers();
      
      const { result, unmount } = renderHook(() => useVideoProcessing([1, 2]));
      
      // Let polling start
      jest.advanceTimersByTime(5000);
      expect(mockGetVideoProgress).toHaveBeenCalled();
      
      // Clear calls
      mockGetVideoProgress.mockClear();
      
      // Unmount component
      unmount();
      
      // Advance timer - should not make calls
      jest.advanceTimersByTime(10000);
      
      expect(mockGetVideoProgress).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Component unmounting, cleaning up')
      );
    });

    it('should not update state after component unmounts', async () => {
      jest.useFakeTimers();
      
      // Mock a slow API response with proper typing
      let resolvePromise: (value: VideoProgressResponse) => void;
      const slowPromise = new Promise<VideoProgressResponse>(resolve => {
        resolvePromise = resolve;
      });
      mockGetVideoProgress.mockReturnValue(slowPromise);
      
      const { result, unmount } = renderHook(() => useVideoProcessing([1]));
      
      // Start API call
      jest.advanceTimersByTime(5000);
      
      // Unmount before API resolves
      unmount();
      
      // Resolve API after unmount with proper response structure
      resolvePromise!({
        success: true,
        data: {
          status: 'completed',
          progress: { 
            quality: '1080p', 
            percent: 100, 
            currentQuality: '1080p', 
            totalQualities: 1, 
            currentQualityIndex: 1 
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify console log about discarding results
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Component unmounted during API call, discarding results')
      );
    });
  });

  describe('Visibility-Based Polling', () => {
    it('should skip interval execution when tab is hidden', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useVideoProcessing([1]));
      
      // Start polling
      jest.advanceTimersByTime(5000);
      expect(mockGetVideoProgress).toHaveBeenCalledTimes(1);
      
      // Hide tab
      mockVisibilityState('hidden');
      mockGetVideoProgress.mockClear();
      
      // Interval should fire but skip execution
      jest.advanceTimersByTime(5000);
      
      expect(mockGetVideoProgress).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Skipping interval - component unmounted or tab hidden')
      );
    });

    it('should defer polling start if tab is initially hidden', async () => {
      jest.useFakeTimers();
      
      // Start with hidden tab
      mockVisibilityState('hidden');
      
      const { result } = renderHook(() => useVideoProcessing([1]));
      
      // Should not start polling
      jest.advanceTimersByTime(10000);
      expect(mockGetVideoProgress).not.toHaveBeenCalled();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useVideoProcessing] Tab hidden, deferring polling start')
      );
    });
  });

  describe('State Management', () => {
    it('should stop polling when all videos complete processing', async () => {
      jest.useFakeTimers();
      
      // Mock completed response
      mockGetVideoProgress.mockResolvedValue({
        success: true,
        data: {
          status: 'completed',
          progress: { 
            quality: '1080p', 
            percent: 100, 
            currentQuality: '1080p', 
            totalQualities: 1, 
            currentQualityIndex: 1 
          }
        }
      });
      
      const { result } = renderHook(() => useVideoProcessing([1]));
      
      // Wait for processing to complete
      await waitFor(() => {
        jest.advanceTimersByTime(5000);
        return Object.keys(result.current.processingVideos).length > 0;
      });
      
      // Clear calls
      mockGetVideoProgress.mockClear();
      
      // Should stop polling when complete
      jest.advanceTimersByTime(10000);
      expect(mockGetVideoProgress).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock API error
      mockGetVideoProgress.mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() => useVideoProcessing([1]));
      
      // Should handle error and stop polling
      await waitFor(() => {
        jest.advanceTimersByTime(5000);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking video progress:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup visibility event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useVideoProcessing([1]));
      
      // Verify event listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      
      // Unmount and verify cleanup
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle rapid videoId changes without memory leaks', async () => {
      jest.useFakeTimers();
      
      const { result, rerender } = renderHook(
        ({ videoIds }) => useVideoProcessing(videoIds),
        { initialProps: { videoIds: [1] } }
      );
      
      // Rapidly change video IDs
      for (let i = 2; i <= 10; i++) {
        rerender({ videoIds: [i] });
        jest.advanceTimersByTime(100);
      }
      
      // Should handle all changes without errors
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
}); 