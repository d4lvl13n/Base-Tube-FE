// src/components/pages/VideoUpload.tsx

import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Video,
  Image as ImageIcon,
  Tag,
  Globe2,
  Lock,
  Eye,
  AlertCircle,
  X,
  Sparkles,
  FileVideo,
  Image,
  Info,
} from 'lucide-react';
import { uploadVideo, generateVideoDescription } from '../../../api/video';
import { useChannels } from '../../../context/ChannelContext';
import VideoUploadSuccess from '../../common/ModalScreen/VideoUploadSuccess';
import { useNavigate } from 'react-router-dom';
import AIAssistantPanel from '../../common/AIAssistantPanel';
import RichTextEditor from '../../common/RichTextEditor';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';
import * as Tooltip from '@radix-ui/react-tooltip';

interface VisibilityOption {
  id: 'public' | 'unlisted' | 'private';
  icon: React.ElementType;
  label: string;
  description: string;
}

const VideoUpload: React.FC = () => {
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [uploadStalled, setUploadStalled] = useState(false);
  const lastProgressRef = useRef(0);
  const lastProgressTimeRef = useRef(Date.now());
  const uploadTimerRef = useRef<NodeJS.Timeout>();
  const stallCheckTimerRef = useRef<NodeJS.Timeout>();

  const { channels } = useChannels();
  const navigate = useNavigate();

  useEffect(() => {
    if (channels.length > 0 && selectedChannelId === null) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels]);

  const visibilityOptions: VisibilityOption[] = [
    { id: 'public', icon: Globe2, label: 'Public', description: 'Anyone can watch this video' },
    { id: 'unlisted', icon: Eye, label: 'Unlisted', description: 'Only people with the link can watch' },
    { id: 'private', icon: Lock, label: 'Private', description: 'Only you can watch' },
  ];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setStep(2);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });

      if (!file.type.startsWith('video/')) {
        console.error('Invalid file type:', file.type);
        alert('Please upload a valid video file.');
        return;
      }

      setSelectedFile(file);
      setStep(2);
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Thumbnail selected:', {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });

      if (!file.type.startsWith('image/')) {
        console.error('Invalid thumbnail type:', file.type);
        alert('Please upload a valid image file for the thumbnail.');
        return;
      }

      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setThumbnailPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearTimers = () => {
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
    if (stallCheckTimerRef.current) clearInterval(stallCheckTimerRef.current);
  };

  const handlePublish = async () => {
    if (!selectedFile || !selectedChannelId || !title.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    clearTimers(); // Clear any existing timers
    setUploadStalled(false);
    lastProgressRef.current = 0;
    lastProgressTimeRef.current = Date.now();

    // Set up stall detection
    stallCheckTimerRef.current = setInterval(() => {
      const stallDuration = Date.now() - lastProgressTimeRef.current;
      if (stallDuration > 30000 && uploadProgress < 100 && uploadProgress === lastProgressRef.current) {
        console.warn('Upload appears stalled:', {
          lastProgress: lastProgressRef.current,
          stallDuration: `${Math.round(stallDuration / 1000)}s`
        });
        setUploadStalled(true);
      }
    }, 5000);

    // Set up global timeout
    uploadTimerRef.current = setTimeout(() => {
      console.error('Upload timed out after 30 minutes');
      setStep(2);
      alert('Upload timed out. Please try again.');
      clearTimers();
    }, 1800000); // 30 minutes

    try {
      setStep(3);
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('channel_id', selectedChannelId.toString());
      formData.append('is_public', visibility === 'public' ? 'true' : 'false');
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await uploadVideo(formData, (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          
          // Update stall detection refs
          if (progress > lastProgressRef.current) {
            lastProgressRef.current = progress;
            lastProgressTimeRef.current = Date.now();
            setUploadStalled(false);
          }
        }
      });

      clearTimers();
      setUploadedVideoId(response.data.id);
      setStep(4);
    } catch (error: any) {
      clearTimers();
      console.error('Upload failed with error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // More specific error messages based on error type
      let errorMessage = 'Failed to upload video. Please try again.';
      
      if (error.response?.status === 413) {
        errorMessage = 'Video file is too large. Maximum size is 2GB.';
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported video format. Please use MP4, MOV, or AVI.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      alert(errorMessage);
      setStep(2);
    }
  };

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      console.error('Description generation failed: No title provided');
      alert('Please enter a video title first');
      return;
    }

    console.log('Starting AI description generation:', {
      title,
      keywordsLength: keywords.length,
      additionalInfoLength: additionalInfo.length
    });

    setIsGenerating(true);
    try {
      const { description: generated, suggestedTitle } = 
        await generateVideoDescription(title, keywords, additionalInfo);
      
      console.log('Description generated successfully:', {
        descriptionLength: generated.length,
        hasSuggestedTitle: !!suggestedTitle
      });

      setGeneratedDescription(generated);
      setSuggestedTitle(suggestedTitle);
    } catch (error: any) {
      console.error('Description generation failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`
                relative w-full h-64 rounded-xl border-2 border-dashed 
                transition-colors duration-300 flex flex-col items-center justify-center
                ${
                  dragActive
                    ? 'border-[#fa7517] bg-[#fa7517]/10'
                    : 'border-gray-700 hover:border-gray-600 bg-black/50'
                }
              `}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload
                className={`w-12 h-12 mb-4 ${
                  dragActive ? 'text-[#fa7517]' : 'text-gray-400'
                }`}
              />
              <p className="text-lg font-medium text-gray-300">Drag and drop your video here</p>
              <p className="text-sm text-gray-500 mt-2">or click to browse</p>
              <p className="text-xs text-gray-600 mt-4">Maximum file size: 2GB</p>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-7 gap-8"
          >
            {/* Left Column - Video Preview & Thumbnail - Takes 3 columns */}
            <div className="lg:col-span-3 space-y-8">
              {/* Video Preview Card */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h2 className="text-xl font-medium text-white mb-6">Video Preview</h2>
                <div className="relative rounded-lg overflow-hidden bg-black/50">
                  <video
                    src={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                    controls
                    className="w-full aspect-video"
                  />
                </div>
              </div>

              {/* Thumbnail Card */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-white">Thumbnail</h2>
                  <button
                    onClick={() => document.getElementById('thumbnail-upload')?.click()}
                    className="px-6 py-2.5 bg-[#fa7517] hover:bg-[#ff8c3a] text-black 
                             rounded-lg font-medium transition-colors"
                  >
                    Upload Thumbnail
                  </button>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
                
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black/50">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <img 
                        src="/assets/thumbnail-placeholder.svg" 
                        alt="Upload thumbnail" 
                        className="w-20 h-20 opacity-50"
                      />
                      <p className="text-lg">No thumbnail uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Requirements Card */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h2 className="text-xl font-medium text-white mb-6">Upload Requirements</h2>
                
                {/* Video Requirements */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#fa7517]">
                      <FileVideo className="w-5 h-5" />
                      <h3 className="font-medium">Video File</h3>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm pl-7">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Formats: MP4 or QuickTime (.mp4, .mov)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Maximum size: 2GB
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Recommended resolution: 1080p or 720p
                      </li>
                    </ul>
                  </div>

                  {/* Thumbnail Requirements */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#fa7517]">
                      <Image className="w-5 h-5" />
                      <h3 className="font-medium">Thumbnail</h3>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm pl-7">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Formats: JPG, PNG, or JPEG
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Maximum size: 3MB
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Recommended dimensions: 1280x720 pixels
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Aspect ratio: 16:9 (recommended)
                      </li>
                    </ul>
                  </div>

                  {/* Important Notes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#fa7517]">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="font-medium">Important Notes</h3>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm pl-7">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Files must not be corrupted
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        <span>Video processing may take several minutes</span>
                        <Tooltip.Provider delayDuration={300}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button className="text-gray-400 hover:text-[#fa7517] transition-colors">
                                <Info className="w-4 h-4" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="max-w-xs bg-black/90 backdrop-blur-sm border border-gray-800/30 
                                         rounded-lg px-4 py-3 text-sm text-gray-200 shadow-xl"
                                sideOffset={5}
                              >
                                <p className="mb-2">
                                  Our system is designed to process videos in multiple qualities:
                                </p>
                                <ul className="space-y-1 text-gray-300">
                                  <li>• 1080p (Full HD)</li>
                                  <li>• 720p (HD)</li>
                                  <li>• 480p (SD)</li>
                                </ul>
                                <p className="mt-2 text-gray-400">
                                  Currently, videos will be displayed in their original uploaded quality. 
                                  Multi-quality support is under development.
                                </p>
                                <Tooltip.Arrow className="fill-black/90" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Keep the upload page open until processing is complete
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Upload progress can be monitored in real-time
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Video Details Form - Takes 4 columns */}
            <div className="lg:col-span-4 space-y-8">
              {/* Channel Selection */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h2 className="text-xl font-medium text-white mb-6">Channel</h2>
                <ChannelSelector />
              </div>

              {/* Video Details */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-8">
                <h2 className="text-xl font-medium text-white">Video Details</h2>

                {/* Title */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="w-full px-5 py-3 bg-gray-900/50 border border-gray-800/30 rounded-lg text-white 
                               focus:ring-2 focus:ring-[#fa7517]/50 focus:border-[#fa7517]/50
                               min-h-[48px] text-lg"
                  />
                </div>

                {/* Description - Even more height */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-base font-medium text-gray-200">Description</label>
                    <motion.button
                      onClick={() => setIsAIPanelOpen(true)}
                      className="flex items-center space-x-2 text-[#fa7517] hover:text-[#ff8c3a] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles className="w-5 h-5" />
                      <span className="text-base">AI Assistant</span>
                    </motion.button>
                  </div>
                  <div className="min-h-[400px]">
                    <RichTextEditor
                      content={description}
                      onChange={setDescription}
                      className="w-full bg-gray-900/50 border border-gray-800/30 rounded-lg text-white
                               focus:ring-2 focus:ring-[#fa7517]/50 focus:border-[#fa7517]/50"
                      placeholder="Enter video description..."
                      minHeight="400px"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">Tags</label>
                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-900/50 border border-gray-800/30 rounded-lg">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="flex-1 bg-transparent focus:outline-none text-white text-lg"
                      placeholder="Add tags (separated by commas)"
                    />
                  </div>
                </div>

                {/* Visibility Options */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-200">Visibility</label>
                  <div className="grid grid-cols-3 gap-4">
                    {visibilityOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`
                          flex flex-col items-center p-6 rounded-lg cursor-pointer transition-all
                          hover:transform hover:scale-[1.02] active:scale-[0.98]
                          ${
                            visibility === option.id
                              ? 'bg-[#fa7517]/10 border border-[#fa7517]/30'
                              : 'bg-gray-900/50 border border-gray-800/30 hover:bg-gray-800/50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.id}
                          checked={visibility === option.id}
                          onChange={(e) => setVisibility(e.target.value as 'public' | 'unlisted' | 'private')}
                          className="hidden"
                        />
                        <option.icon
                          className={`w-8 h-8 mb-3 ${
                            visibility === option.id ? 'text-[#fa7517]' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-medium text-white text-center mb-2">{option.label}</p>
                        <p className="text-sm text-gray-400 text-center leading-tight">
                          {option.description}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Publish Button - Added back */}
                <div className="pt-4 border-t border-gray-800/30">
                  <motion.button
                    onClick={handlePublish}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-[#fa7517] hover:bg-[#ff8c3a] text-black 
                             rounded-lg font-medium text-lg transition-colors
                             flex items-center justify-center gap-3"
                  >
                    <Upload className="w-6 h-6" />
                    Publish Video
                  </motion.button>
                  {/* Optional helper text */}
                  <p className="text-sm text-gray-400 text-center mt-3">
                    Make sure all required fields are filled before publishing
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return renderUploadProgress();

      case 4:
        return (
          <VideoUploadSuccess
            videoTitle={title}
            videoId={uploadedVideoId}
            uploadProgress={uploadProgress}
            onClose={() => {
              setStep(1);
              setSelectedFile(null);
              setThumbnailFile(null);
              setThumbnailPreview(null);
              setTitle('');
              setDescription('');
              setTags('');
              setUploadProgress(0);
              navigate('/creator-hub/videos');
            }}
          />
        );

      default:
        return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Add stall warning to upload progress UI
  const renderUploadProgress = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-6">
          <Video className="w-8 h-8 text-[#fa7517]" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">{selectedFile?.name}</h3>
            <p className="text-sm text-gray-400">
              {uploadStalled ? 'Upload stalled' : 'Uploading video...'}
            </p>
          </div>
          <button
            onClick={() => {
              clearTimers();
              setStep(2);
            }}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            className={`absolute left-0 top-0 h-full bg-[#fa7517] transition-opacity ${
              uploadStalled ? 'opacity-50 animate-pulse' : ''
            }`}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{uploadProgress}% uploaded</p>

        {uploadStalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-200">
                Upload appears to be stalled. You can wait or try again.
              </p>
              <button
                onClick={() => {
                  clearTimers();
                  setStep(2);
                }}
                className="mt-2 px-4 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 
                           rounded-lg text-yellow-200 text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pt-20"
      layout="position"
    >
      <div className="max-w-[1920px] mx-auto px-6 pb-8">
        <div className="min-h-[calc(100vh-200px)]">
          {step === 1 && (
            renderStep()
          )}

          {step === 2 && (
            renderStep()
          )}

          {step === 3 && renderUploadProgress()}

          {step === 4 && (
            <VideoUploadSuccess
              videoTitle={title}
              videoId={uploadedVideoId}
              uploadProgress={uploadProgress}
              onClose={() => {
                setStep(1);
                setSelectedFile(null);
                setThumbnailFile(null);
                setThumbnailPreview(null);
                setTitle('');
                setDescription('');
                setTags('');
                setUploadProgress(0);
                navigate('/creator-hub/videos');
              }}
            />
          )}
        </div>
      </div>

      <AIAssistantPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        title={title}
        keywords={keywords}
        additionalInfo={additionalInfo}
        onKeywordsChange={setKeywords}
        onAdditionalInfoChange={setAdditionalInfo}
        onGenerate={handleGenerateDescription}
        isGenerating={isGenerating}
        suggestedTitle={suggestedTitle}
        generatedDescription={generatedDescription}
        onAcceptTitle={() => {
          setTitle(suggestedTitle || '');
          setSuggestedTitle(undefined);
        }}
        mode="video"
      />
    </motion.div>
  );
};

export default VideoUpload;