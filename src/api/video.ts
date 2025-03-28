import api from './index';
import { RecommendedVideo, PaginationResponse, TrendingVideoResponse, Video, RecommendedVideosResponse } from '../types/video';
import { AxiosProgressEvent } from 'axios';
import { LikeResponse, BatchLikeStatusResponse, LikedVideosResponse, LikeStatusResponse } from '../types/like';
import axios from 'axios';


interface InitViewResponse {
  success: boolean;
  message: string;
  data: {
    viewId: string;
  };
}

interface UpdateViewRequest {
  watchedDuration: number;
  completed?: boolean;
}

interface UpdateViewResponse {
  success: boolean;
  message: string;
  data: {
    viewId: string;
  };
}

interface GenerateVideoDescriptionResponse {
  description: string;
  suggestedTitle: string;
}

interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

interface UpdateVideoResponse {
  success: boolean;
  message: string;
  data?: Video;
}

interface FeaturedVideoResponse {
  success: boolean;
  data: {
    videos: Array<{
      id: number;
      title: string;
      description: string;
      duration: number;
      views_count: number;
      likes_count: number;
      thumbnail_url: string;
      created_at: string;
      channel: {
        id: number;
        name: string;
        handle: string;
        channel_image_url: string;
        owner: {
          username: string | null;
          profile_image_url: string | null;
        }
      } | null;
      rotation: {
        period: number;
        next_update: string;
      }
    }>;
    rotation: {
      period_hours: number;
      next_update: string;
    };
    total: number;
  }
}

export interface VideoProgressData {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: {
    quality: string;
    percent: number;
    currentQuality: string;
    totalQualities: number;
    currentQualityIndex: number;
  };
  error?: {
    message: string;
    jobId?: string;
  };
}

export interface VideoProgressResponse {
  success: boolean;
  data: VideoProgressData;
}

export const getAllVideos = (page: number = 1, limit: number = 10) =>
  api.get(`/api/v1/videos?page=${page}&limit=${limit}`).then((res) => res.data.data);

export const getVideoById = (id: string) =>
  api.get(`/api/v1/videos/${id}`).then((res) => res.data.data);

export const getFeaturedVideos = (limit: number = 2): Promise<FeaturedVideoResponse['data']['videos']> => 
  api.get<FeaturedVideoResponse>(`/api/v1/videos/featured?limit=${limit}`)
    .then(res => res.data.data.videos);

export const getRecommendedVideos = async (page: number = 1, limit: number = 10): Promise<RecommendedVideosResponse> => {
  const response = await api.get<PaginationResponse<RecommendedVideo>>(
    `/api/v1/videos/recommended`,
    {
      params: {
        page,
        limit
      }
    }
  );

  return {
    videos: response.data.data,
    pagination: response.data.pagination
  };
};

export type TimeFrame = 'today' | 'week' | 'month' | 'all';
export type SortOption = 'trending' | 'latest' | 'popular' | 'random';

export interface GetTrendingVideosParams {
  page?: number;
  limit?: number;
  timeFrame?: TimeFrame;
  sort?: SortOption;
}

export const getTrendingVideos = async ({
  page = 1,
  limit = 10,
  timeFrame = 'week',
  sort = 'trending'
}: GetTrendingVideosParams = {}): Promise<TrendingVideoResponse> => {
  try {
    const response = await api.get<TrendingVideoResponse>(
      `/api/v1/videos/trending`,
      {
        params: {
          page,
          limit,
          timeFrame,
          sort
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }
};

export const getNFTVideos = (limit: number = 4) =>
  api.get(`/api/v1/videos/nft?limit=${limit}`).then((res) => res.data.data);

export const getVideos = (category: string, limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos?category=${category}&limit=${limit}`);

export const uploadVideo = async (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) => {
  try {
    // Log the FormData contents
    console.log('Upload API - FormData contents:', {
      hasVideo: formData.has('video'),
      videoFile: formData.get('video'),
      hasTitle: formData.has('title'),
      hasDescription: formData.has('description'),
      hasThumbnail: formData.has('thumbnail'),
      hasChannelId: formData.has('channel_id'),
      hasVisibility: formData.has('is_public'),
    });

    // Log request configuration
    console.log('Upload API - Request configuration:', {
      endpoint: '/api/v1/videos/upload',
      contentType: 'multipart/form-data',
      formDataSize: Array.from(formData.entries()).reduce((total, [_, value]) => {
        if (value instanceof File) {
          return total + value.size;
        }
        return total + new Blob([String(value)]).size;
      }, 0) / (1024 * 1024), // Size in MB
    });

    const response = await api.post<{
      id: string;
      message: string;
      video_path: string;
      thumbnail_path: string;
    }>('/api/v1/videos/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        console.log('Upload API - Progress:', {
          loaded: `${(progressEvent.loaded / (1024 * 1024)).toFixed(2)}MB`,
          total: progressEvent.total ? `${(progressEvent.total / (1024 * 1024)).toFixed(2)}MB` : 'unknown',
          progress: progressEvent.total ? `${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%` : 'calculating...'
        });
        
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      },
      // Add timeout and max content length configurations
      timeout: 300000, // 5 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Upload API - Success:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    return response;
  } catch (error: any) {
    console.error('Upload API - Error details:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout,
      }
    });

    // Log specific error types
    if (error.response) {
      // Server responded with error
      console.error('Upload API - Server error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Upload API - Network error:', {
        request: error.request,
        message: 'No response received from server'
      });
    } else {
      // Error in request configuration
      console.error('Upload API - Request configuration error:', {
        message: error.message
      });
    }

    throw error;
  }
};

export const updateVideo = async (id: string, formData: FormData): Promise<UpdateVideoResponse> => {
  try {
    const response = await api.put<UpdateVideoResponse>(
      `/api/v1/videos/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating video:', error);
    // Properly handle different error types
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Failed to update video';
      throw new Error(message);
    }
    throw error;
  }
};

export const deleteVideo = async (id: string): Promise<DeleteVideoResponse> => {
  try {
    const response = await api.delete<DeleteVideoResponse>(`/api/v1/videos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting video:', error);
    // Properly handle different error types
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Failed to delete video';
      throw new Error(message);
    }
    throw error;
  }
};

export const toggleVideoLike = async (videoId: string): Promise<LikeResponse> => {
  try {
    const response = await api.post<LikeResponse>(
      `/api/v1/likes/videos/${videoId}/toggle`
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling video like:', error);
    throw error;
  }
};

export const getLikedVideos = async (page: number = 1, limit: number = 10): Promise<LikedVideosResponse> => {
  try {
    const response = await api.get<LikedVideosResponse>(
      `/api/v1/likes/videos?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    throw error;
  }
};

export const getBatchLikeStatus = async (videoIds: number[]): Promise<BatchLikeStatusResponse> => {
  try {
    const response = await api.post<BatchLikeStatusResponse>(
      '/api/v1/likes/videos/batch-status',
      { videoIds }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching batch like status:', error);
    throw error;
  }
};

export const getVideoLikeStatus = async (videoId: string): Promise<LikeStatusResponse> => {
  try {
    const response = await api.get<LikeStatusResponse>(
      `/api/v1/likes/videos/${videoId}/status`
    );
    return response.data;
  } catch (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
};

export const initializeVideoView = async (
  videoId: string, 
  watchedDuration: number
): Promise<InitViewResponse> => {
  try {
    console.debug('Initializing video view:', {
      videoId,
      watchedDuration
    });

    const payload = {
      watchedDuration
    };

    const response = await api.post<InitViewResponse>(
      `/api/v1/videos/${videoId}/views`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    console.debug('View initialization response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to initialize view:', error);
    throw error;
  }
};

export const updateVideoView = async (
  videoId: string,
  viewId: string,
  watchedDuration: number,
  completed?: boolean
): Promise<UpdateViewResponse> => {
  try {
    const payload: UpdateViewRequest = {
      watchedDuration,
      completed
    };

    const response = await api.patch<UpdateViewResponse>(
      `/api/v1/videos/${videoId}/views/${viewId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to update view:', error);
    throw error;
  }
};

export const generateVideoDescription = async (
  title: string,
  keywords?: string,
  additionalInfo?: string
): Promise<GenerateVideoDescriptionResponse> => {
  try {
    const params = new URLSearchParams({
      title,
      ...(keywords && { keywords }),
      ...(additionalInfo && { additionalInfo })
    });

    const response = await api.get<GenerateVideoDescriptionResponse>(
      `/api/v1/videos/description?${params.toString()}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating video description:', error);
    throw error;
  }
};

export const getVideoProgress = async (videoId: number): Promise<VideoProgressResponse> => {
  const response = await api.get(`/api/v1/videos/progress/${videoId}`);
  return response.data;
};

export const retryVideoProcessing = async (videoId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/v1/videos/retry/${videoId}`);
  return response.data;
};
// Types for the API response
export interface WatchHistoryResponse {
  // VideoHistory fields
  id: number;
  user_id: string | null;
  video_id: number;
  durationWatched: number;
  completed: boolean;
  is_counted: boolean;
  view_id: string;
  last_updated: Date;
  createdAt: Date;
  
  // Video association with included fields
  video?: {
    id: number;
    title: string;
    description: string;
    thumbnail_path: string | null;
    thumbnail_url?: string;  // Added by backend
    duration: number;
    views_count: number;
    likes_count: number;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    
    // Channel association with included fields
    channel?: {
      id: number;
      name: string;
      channel_image_path: string;
      channel_image_url?: string;  // Added by backend
    };
  };
}

// API client function
export const getUserWatchHistory = async (page: number = 1, limit: number = 10): Promise<{
  success: boolean;
  data: WatchHistoryResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  try {
    const response = await api.get('/api/v1/profile/history/watch', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    throw error;
  }
};