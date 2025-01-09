import { useState, useCallback, useRef } from 'react';
import { batchUploadApi, UploadSession, UploadProgressData } from '../api/batchUpload';
import axios from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNKING_THRESHOLD = 150 * 1024 * 1024; // 150MB
const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Base delay in ms

interface UploadProgress {
  [uploadId: string]: UploadProgressData;
}

export const useBatchUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = (uploadId: string, chunkNumber: number, total: number) => {
    setProgress(prev => {
      const status = chunkNumber === total ? 'completed' as const : 'uploading' as const;
      return {
        ...prev,
        [uploadId]: {
          progress: Math.round((chunkNumber / total) * 100),
          completedCount: chunkNumber,
          totalChunks: total,
          status
        }
      };
    });
  };

  const uploadChunkWithRetry = async (
    chunk: Blob,
    presignedUrl: string,
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    retries = MAX_RETRIES
  ): Promise<void> => {
    try {
      // Upload chunk
      const response = await axios.put(presignedUrl, chunk, {
        headers: { 'Content-Type': 'application/octet-stream' }
      });

      const eTag = response.headers.etag || response.headers['ETag'] || '"unknown"';

      // Record completion with size information
      await batchUploadApi.recordChunkCompletion(
        uploadId,
        chunkIndex + 1,
        eTag,
        chunk.size
      );

      // Update progress after successful chunk upload
      updateProgress(uploadId, chunkIndex, totalChunks);
    } catch (error) {
      if (retries > 0) {
        // Check progress before retry
        const progress = await batchUploadApi.getProgress(uploadId);
        
        if (progress.completedCount > chunkIndex) {
          // Chunk was actually uploaded successfully
          updateProgress(uploadId, chunkIndex, totalChunks);
          return;
        }

        // Get new URL and retry
        const newUrl = await batchUploadApi.retryChunk(uploadId, chunkIndex + 1);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        return uploadChunkWithRetry(
          chunk,
          newUrl,
          uploadId,
          chunkIndex,
          totalChunks,
          retries - 1
        );
      }
      throw error;
    }
  };

  const verifyUpload = async (uploadId: string, totalChunks: number): Promise<boolean> => {
    try {
      // Initial delay to allow backend processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await batchUploadApi.getProgress(uploadId);
      
      const { completedCount, status } = response;
      return completedCount === totalChunks && status === 'completed';
    } catch (error) {
      console.error('Error verifying upload:', error);
      return false;
    }
  };

  const retryFailedChunks = async (
    file: File,
    uploadId: string,
    totalChunks: number
  ): Promise<void> => {
    try {
      const retryInfo = await batchUploadApi.retryChunks(uploadId);
      
      await Promise.all(
        retryInfo.map(async ({ chunkIndex, url }) => {
          const chunk = file.slice(
            chunkIndex * CHUNK_SIZE,
            (chunkIndex + 1) * CHUNK_SIZE
          );
          
          await uploadChunkWithRetry(
            chunk,
            url,
            uploadId,
            chunkIndex,
            totalChunks
          );
        })
      );
    } catch (error) {
      console.error('Failed to retry chunks:', error);
      throw error;
    }
  };

  const uploadSingleFile = async (file: File, presignedUrl: string, uploadId: string): Promise<void> => {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const loaded = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          updateProgress(uploadId, loaded === 100 ? 1 : 0, 1);
        }
      });

      await batchUploadApi.completeUpload(uploadId);
      updateProgress(uploadId, 1, 1);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const verifyUploadWithRetry = async (
    uploadId: string,
    totalChunks: number,
    retries = 3
  ): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      const isComplete = await verifyUpload(uploadId, totalChunks);
      if (isComplete) return true;
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = 2000 * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  };

  const uploadFile = async (file: File, session: UploadSession): Promise<void> => {
    // Validate that client and server agree on chunking strategy
    const shouldBeChunked = file.size > CHUNKING_THRESHOLD;
    if (shouldBeChunked !== session.isChunked) {
      console.warn(
        `Chunking strategy mismatch: Client expected ${shouldBeChunked ? 'chunked' : 'single'} ` +
        `but server returned ${session.isChunked ? 'chunked' : 'single'} upload session`
      );
    }

    // Proceed with server's decision
    if (!session.isChunked) {
      await uploadSingleFile(file, session.presignedUrls[0], session.uploadId);
      return;
    }

    // Create chunks
    const chunks: Blob[] = [];
    let offset = 0;
    while (offset < file.size) {
      chunks.push(file.slice(offset, offset + CHUNK_SIZE));
      offset += CHUNK_SIZE;
    }

    // Validate chunks match presigned URLs
    if (chunks.length !== session.presignedUrls?.length) {
      throw new Error('Mismatch between file chunks and presigned URLs');
    }

    // Upload chunks in batches
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const batchIndexes = Array.from({ length: batch.length }, (_, idx) => i + idx);

      try {
        await Promise.all(
          batchIndexes.map(chunkIndex =>
            uploadChunkWithRetry(
              chunks[chunkIndex],
              session.presignedUrls[chunkIndex],
              session.uploadId,
              chunkIndex,
              chunks.length
            )
          )
        );
      } catch (error) {
        await retryFailedChunks(file, session.uploadId, chunks.length);
      }
    }

    // Add delay before verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify completion before finalizing
    const isComplete = await verifyUploadWithRetry(session.uploadId, chunks.length);
    if (!isComplete) {
      throw new Error(`Upload ${session.uploadId} verification failed after retries`);
    }

    await batchUploadApi.completeUpload(session.uploadId);
    updateProgress(session.uploadId, chunks.length, chunks.length);
  };

  const uploadFiles = useCallback(async (channelId: string | number, files: File[]): Promise<UploadSession[]> => {
    setIsUploading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const fileMetadata = files.map(file => ({
        filename: file.name,
        size: file.size,
        type: file.type
      }));

      const sessions = await batchUploadApi.initBatch(channelId, fileMetadata);

      await Promise.all(
        files.map((file, index) => uploadFile(file, sessions[index]))
      );

      return sessions;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setError(new Error('Upload cancelled'));
    }
  }, []);

  return {
    uploadFiles,
    cancelUpload,
    progress,
    isUploading,
    error,
    retryFailedChunks
  };
};