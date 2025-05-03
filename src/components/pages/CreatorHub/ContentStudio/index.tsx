// src/components/BatchUploadForm.tsx

import React, { useRef, useState, useEffect } from 'react';
import { useBatchUpload } from '../../../../hooks/useBatchUpload';
import { Upload, XCircle, FileVideo, AlertCircle, CheckCircle, Info, ArrowRight, X } from 'lucide-react';
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
import { Link, useNavigate } from 'react-router-dom';
import NoChannelView from '../NoChannelView';

export const ContentStudio: React.FC = () => {
  const { selectedChannelId, channels } = useChannelSelection();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  
  const channelId = selectedChannelId ? parseInt(selectedChannelId, 10) : 0;
  
  const {
    files,
    isUploading,
    error,
    handleSelectFiles,
    handleUpload,
  } = useBatchUpload(channelId);

  const onChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 5) {
        alert('You can only upload up to 5 files at once');
        return;
      }
      handleSelectFiles(selectedFiles);
    }
  };

  // Calculate stats
  const totalFiles = files.length;
  const uploadedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;
  const averageProgress = files.length > 0 
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length)
    : 0;

  // Show success card when all files are uploaded
  React.useEffect(() => {
    if (files.length > 0 && uploadedFiles === files.length) {
      setShowSuccess(true);
    }
  }, [files.length, uploadedFiles]);

  // If user has no channels, show the NoChannelView
  if (channels.length === 0) {
    return (
      <NoChannelView 
        title="Upload Content to Your Channel"
        description="Create a channel to start uploading videos to Base.Tube and share your content with the world."
        buttonText="Create a Channel"
      />
    );
  }

  if (!selectedChannelId && channels.length > 0) {
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
        <SelectButton disabled={isUploading} onClick={onChooseFiles}>
          <Upload className="w-5 h-5" />
          Select Videos
        </SelectButton>
      </Header>

      <InfoCard>
        <Info className="w-5 h-5 text-[#fa7517]" />
        <div>
          <h3 className="font-medium text-white mb-1">Batch Upload Feature</h3>
          <p className="text-gray-400">
            Upload up to 5 videos simultaneously to save time. Once uploaded, you can edit titles, 
            descriptions, and thumbnails in the Videos Management section.
          </p>
        </div>
      </InfoCard>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {!files.length ? (
        <DragDropZone onClick={onChooseFiles}>
          <FileVideo className="w-16 h-16 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drag and drop your videos here</h3>
          <p className="text-gray-400 text-sm mb-4">or click to browse (max 5 files)</p>
          <p className="text-xs text-gray-500">Supported formats: MP4, MOV, AVI</p>
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

          <UploadButton isUploading={isUploading} onClick={handleUpload}>
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="w-5 h-5" />
                </motion.div>
                Uploading...
              </>
            ) : (
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Upload
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            )}
          </UploadButton>

          {error && (
            <ErrorMessage>
              <AlertCircle className="w-5 h-5" />
              {error}
            </ErrorMessage>
          )}

          <FileList>
            <AnimatePresence>
              {files.map((f) => (
                <motion.div
                  key={f.file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <FileItem>
                    <FileDetails>
                      <div className="flex items-center gap-3">
                        <StatusIcon status={f.status}>
                          {f.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : f.status === 'failed' ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <FileVideo className="w-5 h-5" />
                          )}
                        </StatusIcon>
                        <div>
                          <FileName>{f.file.name}</FileName>
                          <span className="text-sm text-gray-400">
                            {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <FileStatus status={f.status}>{f.status}</FileStatus>
                        <FileProgress>{f.progress}%</FileProgress>
                      </div>
                    </FileDetails>
                    <ProgressBar 
                      progress={f.progress}
                      status={f.status}
                    />
                  </FileItem>
                </motion.div>
              ))}
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