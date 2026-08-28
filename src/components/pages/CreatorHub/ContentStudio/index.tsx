// src/components/pages/CreatorHub/ContentStudio/index.tsx

import React, { useRef, useState } from 'react';
import { Upload, XCircle, FileVideo, AlertCircle, CheckCircle, Info, ArrowRight, X } from 'lucide-react';
import type { UploadQueueEntry } from '@basetube/api';
import {
  Container,
  Header,
  Title,
  SelectButton,
  UploadButton,
  FileList,
  FileItem,
  FileName,
  FileProgress,
  FileStatus,
  ErrorMessage,
  ProgressBar,
  StatsContainer,
  StatBox,
  DragDropZone,
  FileDetails,
  StatusIcon,
  InfoCard,
  SuccessCard,
} from './styles';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import NoChannelView from '../NoChannelView';
import { useUploadQueueContext } from '../../../../contexts/UploadQueueContext';

/** Files accepted in one selection — the client-side ceiling from contract 4. */
const MAX_FILES = 50;

/** Queue status → the three visual states the styled components understand. */
function visualStatus(entry: UploadQueueEntry): 'completed' | 'failed' | 'uploading' {
  if (entry.videoStatus === 'processed' || entry.status === 'ready') return 'completed';
  if (['failed', 'held', 'aborted'].includes(entry.status) || entry.videoStatus === 'failed') {
    return 'failed';
  }
  return 'uploading';
}

function statusLabel(entry: UploadQueueEntry): string {
  if (entry.videoStatus === 'processed') return 'ready';
  if (entry.videoStatus === 'failed') return 'processing failed';
  if (entry.status === 'reselect_required') return 'reselect file';
  if (entry.status === 'retry_wait') return 'retrying';
  if (entry.status === 'uploaded') return 'finishing';
  return entry.status;
}

export const ContentStudio: React.FC = () => {
  const { selectedChannelId, channels } = useChannelSelection();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const queue = useUploadQueueContext();
  const channelId = selectedChannelId ? parseInt(selectedChannelId, 10) : 0;
  const files = queue.entries.filter((entry) => entry.channelId === channelId);

  const onChooseFiles = () => fileInputRef.current?.click();

  const enqueue = (selected: File[]) => {
    if (!channelId) return;
    if (selected.length > MAX_FILES) {
      alert(`You can upload up to ${MAX_FILES} files at once`);
      return;
    }
    void queue.enqueueFiles(selected, channelId);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    enqueue(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    enqueue(Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('video/')));
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const totalFiles = files.length;
  const uploadedFiles = files.filter((entry) => visualStatus(entry) === 'completed').length;
  const failedFiles = files.filter((entry) => visualStatus(entry) === 'failed').length;
  const averageProgress =
    files.length > 0
      ? Math.round(files.reduce((acc, entry) => acc + entry.progress, 0) / files.length)
      : 0;
  const isUploading = files.some((entry) =>
    ['queued', 'reserving', 'retry_wait', 'uploading', 'uploaded'].includes(entry.status),
  );

  React.useEffect(() => {
    if (files.length > 0 && uploadedFiles === files.length) setShowSuccess(true);
  }, [files.length, uploadedFiles]);

  if (channels.length === 0) {
    return (
      <NoChannelView
        title="Upload Content to Your Channel"
        description="Create a channel to start uploading videos to Base.Tube and share your content with the world."
        buttonText="Create a Channel"
      />
    );
  }

  if (!selectedChannelId) {
    return (
      <Container>
        <Header>
          <Title>Content Studio</Title>
        </Header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-[400px] text-gray-400"
        >
          <FileVideo className="w-16 h-16 mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold mb-2">No Channel Selected</h3>
          <p className="text-gray-400 mb-6">Please select a channel to start uploading videos</p>

          <Link
            to="/creator-hub/channels"
            className="flex items-center gap-2 px-4 py-2 bg-[#fa7517] text-white rounded-md hover:bg-[#ff8c3a] transition-colors"
          >
            Select Channel
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Content Studio</Title>
          <p className="text-gray-400 text-sm mt-1">Upload and manage multiple videos at once</p>
        </div>
        <SelectButton onClick={onChooseFiles}>
          <Upload className="w-5 h-5" />
          Select Videos
        </SelectButton>
      </Header>

      <InfoCard>
        <Info className="w-5 h-5 text-[#fa7517]" />
        <div>
          <h3 className="font-medium text-white mb-1">Batch Upload</h3>
          <p className="text-gray-400">
            Add up to {MAX_FILES} videos; four upload at a time and the rest wait their turn. Uploads
            continue while you use the rest of the app, and resume after a reload once you reselect the
            same files. Edit titles, descriptions and thumbnails in Videos Management.
          </p>
        </div>
      </InfoCard>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {!files.length ? (
        <DragDropZone
          onClick={onChooseFiles}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragActive(false)}
          style={
            dragActive ? { borderColor: '#fa7517', background: 'rgba(250, 117, 23, 0.08)' } : undefined
          }
        >
          <FileVideo className="w-16 h-16 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drag and drop your videos here</h3>
          <p className="text-gray-400 text-sm mb-4">or click to browse (max {MAX_FILES} files)</p>
          <p className="text-xs text-gray-500">Supported formats: MP4, MOV, AVI — up to 2 GB each</p>
        </DragDropZone>
      ) : (
        <>
          <StatsContainer>
            <StatBox>
              <span className="text-sm text-gray-400">Total Files</span>
              <span className="text-2xl font-semibold">{totalFiles}</span>
            </StatBox>
            <StatBox>
              <span className="text-sm text-gray-400">Uploaded</span>
              <span className="text-2xl font-semibold text-green-500">{uploadedFiles}</span>
            </StatBox>
            <StatBox>
              <span className="text-sm text-gray-400">Failed</span>
              <span className="text-2xl font-semibold text-red-500">{failedFiles}</span>
            </StatBox>
            <StatBox>
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-2xl font-semibold text-[#fa7517]">{averageProgress}%</span>
            </StatBox>
          </StatsContainer>

          <UploadButton isUploading={isUploading} onClick={() => queue.setPaused(!queue.paused)}>
            {queue.paused ? 'Resume uploads' : 'Pause uploads'}
          </UploadButton>

          {queue.actionError && (
            <ErrorMessage>
              <AlertCircle className="w-5 h-5" />
              {queue.actionError}
            </ErrorMessage>
          )}

          <FileList>
            <AnimatePresence>
              {files.map((entry) => {
                const visual = visualStatus(entry);
                return (
                  <motion.div
                    key={entry.localId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <FileItem>
                      <FileDetails>
                        <div className="flex items-center gap-3">
                          <StatusIcon status={visual}>
                            {visual === 'completed' ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : visual === 'failed' ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              <FileVideo className="w-5 h-5" />
                            )}
                          </StatusIcon>
                          <div>
                            <FileName>{entry.filename}</FileName>
                            <span className="text-sm text-gray-400">
                              {(entry.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <FileStatus status={visual}>{statusLabel(entry)}</FileStatus>
                          <FileProgress>{entry.progress}%</FileProgress>
                          {['queued', 'reserving', 'retry_wait', 'uploading'].includes(entry.status) && (
                            <button
                              type="button"
                              onClick={() => void queue.abortEntry(entry.localId)}
                              className="text-xs text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          )}
                          {['failed', 'held', 'aborted'].includes(entry.status) && (
                            <button
                              type="button"
                              onClick={() => void queue.replaceAttempt(entry.localId)}
                              className="text-xs text-[#fa7517] hover:text-[#ff8c3a]"
                            >
                              Try again
                            </button>
                          )}
                        </div>
                      </FileDetails>
                      <ProgressBar progress={entry.progress} status={visual} />
                      {entry.errorMessage && (
                        <p className="text-xs text-red-400 mt-2">{entry.errorMessage}</p>
                      )}
                    </FileItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </FileList>
        </>
      )}

      <AnimatePresence>
        {showSuccess && (
          <SuccessCard
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-[#fa7517]">🎉</div>
                <div>
                  <h3 className="font-medium text-white">Upload Complete!</h3>
                  <p className="text-gray-400">Your videos are ready to be managed</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/creator-hub/videos"
                  className="flex items-center gap-2 text-[#fa7517] hover:text-[#ff8c3a] transition-colors"
                >
                  Manage Videos
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </SuccessCard>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default ContentStudio;
