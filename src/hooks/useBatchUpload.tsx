// src/hooks/useBatchUpload.ts
import { useState, useCallback } from 'react';
import { uploadBatchVideos } from '../api/batchupload';

export interface FileUploadProgress {
  file: File;
  progress: number; 
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  videoId?: number; // once it's known
}

/**
 * Hook to manage multi-file batch upload with direct POST to server.
 * 
 * @param channelId The ID of the channel
 */
export function useBatchUpload(channelId: number) {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add new files to the state, marking them as 'pending'.
   * This might be called from an input[type="file"]. 
   */
  const handleSelectFiles = useCallback((selectedFiles: File[]) => {
    const newFileStates: FileUploadProgress[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...newFileStates]);
  }, []);

  /**
   * Helper to update a given file's progress or status in state.
   */
  const updateFileState = useCallback(
    (file: File, updates: Partial<FileUploadProgress>) => {
      setFiles(prev => 
        prev.map(f => (f.file === file ? { ...f, ...updates } : f))
      );
    },
    []
  );

  /**
   * The main function that triggers the batch upload to the server.
   */
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      // Mark all as 'uploading' with individual progress
      files.forEach(fileState => {
        updateFileState(fileState.file, { 
          status: 'uploading', 
          progress: 0 
        });
      });

      const fileArray = files.map(f => f.file);

      // Modified to track individual file progress
      const response = await uploadBatchVideos(
        channelId, 
        fileArray, 
        (progress) => {
          // Calculate file index based on progress ranges
          const fileIndex = Math.floor((progress * files.length) / 100);
          const fileState = files[fileIndex];
          if (fileState) {
            updateFileState(fileState.file, { 
              progress: ((progress % (100 / files.length)) * files.length)
            });
          }
        }
      );

      // Update completion status individually
      response.forEach((videoData: any, index: number) => {
        const fileState = files[index];
        if (fileState) {
          updateFileState(fileState.file, {
            status: 'completed',
            progress: 100,
            videoId: videoData.id,
          });
        }
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Upload failed';
      setError(errorMsg);

      // Mark all as failed
      files.forEach(fileState => {
        updateFileState(fileState.file, {
          status: 'failed',
          error: errorMsg
        });
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, channelId, updateFileState]);

  return {
    files,
    isUploading,
    error,
    handleSelectFiles,
    handleUpload,
  };
}