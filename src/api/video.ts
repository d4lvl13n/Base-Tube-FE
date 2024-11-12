import api from './index';
import { Video } from '../types/video';
import { AxiosProgressEvent } from 'axios';
import { LikeResponse, BatchLikeStatusResponse, LikedVideosResponse, LikeStatusResponse } from '../types/like';

export const getAllVideos = (page: number = 1, limit: number = 10) =>
  api.get(`/api/v1/videos?page=${page}&limit=${limit}`).then((res) => res.data.data);

export const getVideoById = (id: string) =>
  api.get(`/api/v1/videos/${id}`).then((res) => res.data.data);

export const getFeaturedVideos = (limit: number = 2) => 
  api.get(`/api/v1/videos/featured?limit=${limit}`).then(res => res.data.data);

export const getRecommendedVideos = (page: number = 1, limit: number = 10) =>
  api.get(`/api/v1/videos/recommended?page=${page}&limit=${limit}`).then((res) => res.data.data);

export const getTrendingVideos = (page: number = 1, limit: number = 10) =>
  api.get(`/api/v1/videos/trending?page=${page}&limit=${limit}`).then((res) => res.data.data);

export const getNFTVideos = (limit: number = 4) =>
  api.get(`/api/v1/videos/nft?limit=${limit}`).then((res) => res.data.data);

export const getVideos = (category: string, limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos?category=${category}&limit=${limit}`);

export const uploadVideo = (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) =>
  api.post<{
    id: string;
    message: string;
    video_path: string;
    thumbnail_path: string;
  }>('/api/v1/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const updateVideo = (id: string, formData: FormData) =>
  api.put(`/api/v1/videos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVideo = (id: string) => 
  api.delete(`/api/v1/videos/${id}`);

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
