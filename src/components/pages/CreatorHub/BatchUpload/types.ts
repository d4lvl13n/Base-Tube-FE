// src/components/pages/CreatorHub/BatchUpload/types.ts

import { UploadSession as ApiUploadSession } from '../../../../api/batchUpload';

export interface FileMetadata {
  filename: string;
  size: number;
  type: string;
}
    
export interface UploadSession {
  uploadId: string;
  fileId: string;
  isChunked: boolean;
  totalChunks: number;
  presignedUrls?: string[];
  status: 'initialized' | 'uploading' | 'completed' | 'error';
}

export interface UploadProgressData {
  progress: number;
  completedCount: number;
  totalChunks: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface ChunkStatus {
  status: 'pending' | 'uploading' | 'completed' | 'error';
  eTag?: string;
  attempts: number;
  lastAttempt: number;
}

export interface ProgressResponse {
  progressInfo: UploadProgressData;
  multipartInfo?: {
    chunkStatuses: Record<string, ChunkStatus>;
    totalChunks: number;
    filename: string;
  };
}

export interface BatchUploadProps {
  onComplete?: () => void;
}

export interface FileWithSession {
  file: File;
  uploadId?: string;
  session?: ApiUploadSession;
}