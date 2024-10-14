import api from './index';
import { Video } from '../types/video';

export const getAllVideos = (page: number = 1) => 
  api.get<Video[]>(`/api/v1/videos?page=${page}`);

export const getVideoById = (id: string) => 
  api.get<Video>(`/api/v1/videos/${id}`);

export const getFeaturedVideos = (limit: number = 2) => 
  api.get<Video[]>(`/api/v1/videos/featured?limit=${limit}`);

export const getRecommendedVideos = (limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos/recommended?limit=${limit}`);

export const getTrendingVideos = (limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos/trending?limit=${limit}`);

export const getNFTVideos = (limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos/nft?limit=${limit}`);

export const getVideos = (category: string, limit: number = 4) => 
  api.get<Video[]>(`/api/v1/videos?category=${category}&limit=${limit}`);

export const uploadVideo = (formData: FormData) =>
  api.post('/api/v1/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVideo = (id: string, formData: FormData) =>
  api.put(`/api/v1/videos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVideo = (id: string) => 
  api.delete(`/api/v1/videos/${id}`);