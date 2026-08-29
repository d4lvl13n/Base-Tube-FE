import api from './index';
import { retryUnlessCancelled, wasCancelled } from '../utils/requestCancelled';
import { RecommendedVideo, PaginationResponse, TrendingVideoResponse, Video, RecommendedVideosResponse } from '../types/video';
import { LikeResponse, BatchLikeStatusResponse, LikedVideosResponse, LikeStatusResponse } from '../types/like';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import { ErrorCode } from '../types/error';

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

/**
 * `GET /api/v1/videos/description`.
 *
 * `description` is plain text with `\n` line breaks: a hook, blank-line
 * separated paragraphs, `\u2022` bullet lines, a CTA and a hashtag line. The
 * arrays are optional on the wire because a backend that has not shipped the
 * structured generator yet simply omits them.
 */
export interface GenerateVideoDescriptionResponse {
  description: string;
  suggestedTitle: string;
  keywords?: string[];
  hashtags?: string[];
}

/** Everything the generator can be told about the video it is describing. */
export interface GenerateVideoDescriptionParams {
  /** Required \u2014 the generator has nothing to work from without it. */
  title: string;
  /** Comma-separated list. */
  keywords?: string;
  additionalInfo?: string;
  channelName?: string;
  channelDescription?: string;
  durationSeconds?: number;
  /** The creator's current draft, so the model rewrites instead of inventing. */
  existingDescription?: string;
  /** Comma-separated list. */
  tags?: string;
  /** BCP-47, e.g. `en-GB` \u2014 the description comes back in this language. */
  language?: string;
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

/**
 * `Videos.status` as the batch route reports it — the DB enum, whose terminal
 * success value is `processed`. The legacy single-video route wraps the same
 * row in its own `VideoProgress` shape and spells that value `completed`, so
 * both live in this union and both are terminal.
 */
export type VideoProcessingStatus = 'pending' | 'processing' | 'processed' | 'completed' | 'failed';

export interface VideoProgressData {
  status: VideoProcessingStatus;
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
    /** Present only when the worker names the failure; translated by `uploadCopy`. */
    code?: string;
  };
}

export interface VideoProgressResponse {
  success: boolean;
  data: VideoProgressData;
}

/** One element of the `GET /api/v1/videos/progress?ids=` array. */
export interface VideoProgressBatchRow extends VideoProgressData {
  videoId: number;
  renditions?: Array<{ quality: string; state: string }>;
}

/**
 * The batch progress call, re-keyed by video id for the caller.
 *
 * The wire shape is `{ success, data: VideoProgressBatchRow[] }`; indexing by
 * id happens here so every consumer does not have to re-derive it.
 */
export interface VideoProgressBatchResponse {
  success: boolean;
  data: Record<string, VideoProgressBatchRow>;
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
  const fetchTrending = async () => {
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
  };

  try {
    return await retryWithBackoff(fetchTrending, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'fetch trending videos',
      component: 'videoAPI',
      additionalData: { page, limit, timeFrame, sort }
    });

    throw userError;
  }
};

export const getVideos = (category: string, limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos?category=${category}&limit=${limit}`);

export const updateVideo = async (
  id: string,
  formData: FormData,
  /**
   * Lets the caller put a ceiling on how long it will wait. Without one, a
   * request that never answers is only bounded by the axios timeout times the
   * retries — half an hour, during which the row it belongs to is stuck.
   */
  signal?: AbortSignal
): Promise<UpdateVideoResponse> => {
  const executeUpdate = async () => {
    const response = await api.put<UpdateVideoResponse>(
      `/api/v1/videos/${id}`,
      formData,
      {
        signal,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  };

  try {
    return await retryWithBackoff(executeUpdate, 2, 1000, retryUnlessCancelled);
  } catch (error) {
    // An abort is the caller giving up on purpose, not a server failure to be
    // dressed up as one.
    if (wasCancelled(error)) throw error;
    const userError = handleApiError(error, {
      action: 'update video',
      component: 'videoAPI',
      additionalData: { videoId: id }
    });

    throw userError;
  }
};

export const deleteVideo = async (
  id: string,
  signal?: AbortSignal
): Promise<DeleteVideoResponse> => {
  const executeDelete = async () => {
    const response = await api.delete<DeleteVideoResponse>(`/api/v1/videos/${id}`, { signal });
    return response.data;
  };

  try {
    return await retryWithBackoff(executeDelete, 2, 1000, retryUnlessCancelled);
  } catch (error) {
    if (wasCancelled(error)) throw error;
    const userError = handleApiError(error, {
      action: 'delete video',
      component: 'videoAPI',
      additionalData: { videoId: id }
    });

    // Handle specific delete scenarios
    if (userError.code === ErrorCode.NOT_FOUND) {
      userError.message = 'Video not found. It may have already been deleted.';
    } else if (userError.code === ErrorCode.FORBIDDEN) {
      userError.message = 'You don\'t have permission to delete this video.';
    }

    throw userError;
  }
};

export const toggleVideoLike = async (videoId: string): Promise<LikeResponse> => {
  const executeLike = async () => {
    const response = await api.post<LikeResponse>(
      `/api/v1/likes/videos/${videoId}/toggle`
    );
    return response.data;
  };

  try {
    return await retryWithBackoff(executeLike, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'toggle video like',
      component: 'videoAPI',
      additionalData: { videoId }
    });

    throw userError;
  }
};

export const getLikedVideos = async (page: number = 1, limit: number = 10): Promise<LikedVideosResponse> => {
  const fetchLiked = async () => {
    const response = await api.get<LikedVideosResponse>(
      `/api/v1/likes/videos?page=${page}&limit=${limit}`
    );
    return response.data;
  };

  try {
    return await retryWithBackoff(fetchLiked, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'fetch liked videos',
      component: 'videoAPI',
      additionalData: { page, limit }
    });

    throw userError;
  }
};

export const getBatchLikeStatus = async (videoIds: number[]): Promise<BatchLikeStatusResponse> => {
  const fetchBatchStatus = async () => {
    const response = await api.post<BatchLikeStatusResponse>(
      '/api/v1/likes/videos/batch-status',
      { videoIds }
    );
    return response.data;
  };

  try {
    return await retryWithBackoff(fetchBatchStatus, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'fetch batch like status',
      component: 'videoAPI',
      additionalData: { videoCount: videoIds.length }
    });

    throw userError;
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

/**
 * Ask the backend for a description.
 *
 * Two call shapes, on purpose: the object form carries the full context the
 * upload page can now supply, while the original positional form is kept so the
 * older callers (the edit-video modal) keep compiling unchanged.
 */
export function generateVideoDescription(
  params: GenerateVideoDescriptionParams
): Promise<GenerateVideoDescriptionResponse>;
export function generateVideoDescription(
  title: string,
  keywords?: string,
  additionalInfo?: string
): Promise<GenerateVideoDescriptionResponse>;
export async function generateVideoDescription(
  titleOrParams: string | GenerateVideoDescriptionParams,
  keywords?: string,
  additionalInfo?: string
): Promise<GenerateVideoDescriptionResponse> {
  const input: GenerateVideoDescriptionParams =
    typeof titleOrParams === 'string'
      ? { title: titleOrParams, keywords, additionalInfo }
      : titleOrParams;

  try {
    const params = new URLSearchParams();
    params.set('title', input.title);

    // Empty strings are left out rather than sent: an empty `keywords=` tells
    // the generator nothing and only makes the cache key noisier.
    // The free-text context is capped: this is a GET, and a creator who has
    // pasted an essay into the draft must not turn the request into a 414.
    const optionalText: Array<[string, string | undefined, number]> = [
      ['keywords', input.keywords, 500],
      ['additionalInfo', input.additionalInfo, 2000],
      ['channelName', input.channelName, 200],
      ['channelDescription', input.channelDescription, 1000],
      ['existingDescription', input.existingDescription, 2000],
      ['tags', input.tags, 500],
      ['language', input.language, 35],
    ];
    optionalText.forEach(([key, value, limit]) => {
      const trimmed = value?.trim();
      if (trimmed) params.set(key, trimmed.slice(0, limit));
    });

    if (
      typeof input.durationSeconds === 'number' &&
      Number.isFinite(input.durationSeconds) &&
      input.durationSeconds > 0
    ) {
      params.set('durationSeconds', String(Math.round(input.durationSeconds)));
    }

    const response = await api.get<GenerateVideoDescriptionResponse>(
      `/api/v1/videos/description?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Error generating video description:', error);
    throw error;
  }
}

export const getVideoProgress = async (videoId: number): Promise<VideoProgressResponse> => {
  const response = await api.get(`/api/v1/videos/progress/${videoId}`);
  return response.data;
};

/**
 * Batch progress for the Videos Management dashboard (upload V2, contract 9).
 * `GET /api/v1/videos/progress?ids=1,2,3` — at most 50 ids per call.
 */
export const getVideoProgressBatch = async (
  videoIds: number[]
): Promise<VideoProgressBatchResponse> => {
  const ids = videoIds.slice(0, 50);
  if (ids.length === 0) {
    return { success: true, data: {} };
  }
  const response = await api.get<{ success: boolean; data?: unknown }>(
    `/api/v1/videos/progress`,
    { params: { ids: ids.join(',') } }
  );

  // `data` is an ARRAY of rows, each carrying its own `videoId`; ids the caller
  // does not own are simply absent (the backend filters by ownership in SQL).
  const rows = Array.isArray(response.data?.data)
    ? (response.data.data as VideoProgressBatchRow[])
    : [];
  const byId: Record<string, VideoProgressBatchRow> = {};
  for (const row of rows) {
    if (row && typeof row.videoId === 'number') byId[String(row.videoId)] = row;
  }
  return { success: response.data?.success !== false, data: byId };
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