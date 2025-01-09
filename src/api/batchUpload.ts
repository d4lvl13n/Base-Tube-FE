import api from './index';

export interface FileMetadata {
  filename: string;
  size: number;
  type: string;
}

export interface UploadSession {
  uploadId: string;
  isChunked: boolean;
  presignedUrls: string[];
  totalChunks: number;
  status: 'initialized' | 'uploading' | 'completed' | 'error';
}

export interface UploadProgressData {
  progress: number;
  completedCount: number;
  totalChunks: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface RetryChunkResponse {
  chunkIndex: number;
  url: string;
}

export interface ChunkStatus {
  partNumber: number;
  eTag: string;
  size: number;
  isComplete: boolean;
}

export const batchUploadApi = {
  initBatch: async (channelId: string | number, fileMetadata: FileMetadata[]): Promise<UploadSession[]> => {
    console.log('Sending batch init request:', { channelId, files: fileMetadata });
    const response = await api.post('/api/v1/videos/batch/init', { 
      channelId,
      files: fileMetadata 
    });
    return response.data.data;
  },

  completeUpload: async (uploadId: string): Promise<void> => {
    await api.post(`/api/v1/videos/batch/complete/${uploadId}`);
  },

  getProgress: async (uploadId: string): Promise<UploadProgressData> => {
    const response = await api.get(`/api/v1/videos/batch/progress/${uploadId}`);
    return response.data.data;
  },

  retryChunks: async (uploadId: string): Promise<RetryChunkResponse[]> => {
    const response = await api.post(`/api/v1/videos/batch/retry/${uploadId}`);
    return response.data.data;
  },

  recordChunkCompletion: async (
    uploadId: string, 
    partNumber: number, 
    eTag: string,
    size: number
  ): Promise<void> => {
    await api.post(`/api/v1/videos/batch/chunk/${uploadId}`, {
      partNumber,
      eTag: eTag.replace(/"/g, ''),
      size,
      timestamp: Date.now()
    });
  },

  retryChunk: async (uploadId: string, partNumber: number): Promise<string> => {
    const response = await api.get(`/api/v1/videos/batch/retry/${uploadId}/${partNumber}`);
    return response.data.presignedUrl;
  },

  verifyChunks: async (uploadId: string): Promise<ChunkStatus[]> => {
    const response = await api.get(`/api/v1/videos/batch/verify/${uploadId}`);
    return response.data.data;
  }
};