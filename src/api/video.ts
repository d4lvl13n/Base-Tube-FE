import api from './index';
import { Video } from '../types/video';

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
