import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useChannels } from '../../../../context/ChannelContext';
import { useBatchUpload } from '../../../../hooks/useBatchUpload';
import { styles } from './styles';
import type { BatchUploadProps, FileWithSession } from './types';
import SuccessModal from './SuccessModal';

const BatchUpload: React.FC<BatchUploadProps> = ({ onComplete }) => {
  const [files, setFiles] = useState<FileWithSession[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { channels } = useChannels();
  const { 
    uploadFiles, 
    cancelUpload, 
    progress, 
    isUploading, 
    error: hookError,
    retryFailedChunks 
  } = useBatchUpload();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isUploading) {
        cancelUpload();
      }
    };
  }, [isUploading, cancelUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(file => file.type.startsWith('video/'))
      .map(file => ({
        file,
        uploadId: undefined,
        session: undefined
      }));

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles].slice(0, 5));
    }
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
        .filter(file => file.type.startsWith('video/'))
        .map(file => ({
          file,
          uploadId: undefined,
          session: undefined
        }));
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
    }
  }, []);

  const handleUpload = async () => {
    if (!channels.length || !files.length || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setUploadError(null);
      const channelId = channels[0].id;
      const filesToUpload = files.map(f => f.file);
      
      const sessions = await uploadFiles(channelId, filesToUpload);
      
      setFiles(prev => prev.map((fileWithSession, index) => ({
        ...fileWithSession,
        session: sessions[index],
        uploadId: sessions[index].uploadId
      })));

      setShowSuccessModal(true);
      setUploadedCount(files.length);
      onComplete?.();
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err instanceof Error ? err : new Error('Upload failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = useCallback(async (fileWithSession: FileWithSession) => {
    if (!fileWithSession.session || !fileWithSession.uploadId) return;

    try {
      await retryFailedChunks(
        fileWithSession.file,
        fileWithSession.uploadId,
        fileWithSession.session.presignedUrls?.length || fileWithSession.session.totalChunks
      );
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [retryFailedChunks]);

  const removeFile = useCallback((fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }, []);

  const getFileProgress = useCallback((fileWithSession: FileWithSession) => {
    if (!fileWithSession.uploadId) return 0;
    const fileProgress = progress[fileWithSession.uploadId];
    return fileProgress?.progress || 0;
  }, [progress]);

  const getFileStatus = useCallback((fileWithSession: FileWithSession) => {
    if (!fileWithSession.uploadId) return 'pending';
    const fileProgress = progress[fileWithSession.uploadId];
    return fileProgress?.status || 'pending';
  }, [progress]);

  const renderFileCard = useCallback((fileWithSession: FileWithSession) => {
    const { file } = fileWithSession;
    const currentProgress = getFileProgress(fileWithSession);
    const status = getFileStatus(fileWithSession);
    const fileProgress = fileWithSession.uploadId ? progress[fileWithSession.uploadId] : undefined;
    const fileError = fileProgress?.error;

    return (
      <motion.div
        key={file.name}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={styles.fileCard}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-white truncate">{file.name}</h3>
            <p className="text-sm text-gray-400">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          {status === 'completed' && (
            <CheckCircle2 className={styles.statusIcon.completed} />
          )}

          {status === 'error' && (
            <button
              onClick={() => handleRetry(fileWithSession)}
              className={styles.retryButton}
            >
              <AlertCircle className={styles.statusIcon.error} />
            </button>
          )}

          {status === 'uploading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Upload className={styles.statusIcon.uploading} />
            </motion.div>
          )}

          {status === 'pending' && !isUploading && (
            <button
              onClick={() => removeFile(file)}
              className={styles.removeButton}
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        <div className={styles.progressTrack}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: '0%' }}
            animate={{ width: `${currentProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {fileError && (
          <p className={styles.fileError}>
            {fileError}
          </p>
        )}
      </motion.div>
    );
  }, [getFileProgress, getFileStatus, isUploading, progress, removeFile, handleRetry]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Multi-Upload Studio</h1>
          <p className={styles.subtitle}>
            Upload multiple videos at once and manage them efficiently
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${styles.uploadZone} ${
            dragActive ? styles.uploadZoneActive : ''
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            className="sr-only"
            id="file-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className={styles.uploadLabel}
          >
            <Upload className={styles.uploadIcon} />
            <span className={styles.uploadText}>
              Drag & drop videos or click to browse
            </span>
          </label>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map(fileWithSession => renderFileCard(fileWithSession))}
            </div>
          )}
        </AnimatePresence>

        {(uploadError || hookError) && (
          <div className={styles.errorMessage}>
            {uploadError?.message || hookError?.message}
          </div>
        )}

        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={isSubmitting || isUploading || !channels.length}
            className={styles.button.primary}
          >
            {isSubmitting || isUploading ? 'Uploading...' : 'Start Upload'}
          </button>
        )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        uploadedCount={uploadedCount}
      />
    </>
  );
};

export default BatchUpload;