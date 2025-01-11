// src/api/BatchUpload.ts
import api from './index'; // axios or your pre-configured Axios instance

export interface VideoUploadResponse {
  id: number;
  title: string;
  video_path: string;
  thumbnail_path: string;
  duration: number;
  status: string;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Upload multiple video files in a single request.
 * The back-end endpoint is expected to be POST /api/v1/videos/batch/init
 * which handles up to 5 files, each named "file" in FormData.
 */
export async function uploadBatchVideos(
  channelId: number,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<VideoUploadResponse[]> {
  const formData = new FormData();

  // Multiple files under the same field name "videos", if your backend expects "videos[]"
  // or "file". (In your example, you used 'file', so let's mirror that.)
  files.forEach(file => {
    formData.append('videos', file); 
  });

  // Add channel ID
  formData.append('channelId', channelId.toString());

  const response = await api.post('/api/v1/videos/batch/init', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data.data; 
  // the .data.data is based on your backend returning { success: true, data: [videoObjects] } 
}

export interface VideoStatusResponse {
  status: string; // e.g. "pending", "processed", "failed", etc.
  progress?: number; // optional, if your backend returns some numeric progress
}

/**
 * If your back-end offers a GET endpoint to check a single video's processing status,
 * you can add that here:
 */
export async function getVideoStatus(videoId: number): Promise<VideoStatusResponse> {
  const response = await api.get(`/api/v1/videos/${videoId}/status`);
  return response.data.data;
}

const batchUploadApi = {
  uploadBatchVideos,
  getVideoStatus,
};

export default batchUploadApi;