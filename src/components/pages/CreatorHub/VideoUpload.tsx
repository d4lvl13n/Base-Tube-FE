// src/components/pages/VideoUpload.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Tag,
  Globe2,
  Lock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { generateVideoDescription } from '../../../api/video';
import { useUploadQueueContext } from '../../../contexts/UploadQueueContext';
import VideoUploadSuccess from '../../common/ModalScreen/VideoUploadSuccess';
import { useNavigate } from 'react-router-dom';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import { showErrorToast, uploadErrors } from '../../common/Notifications/ErrorToast';
import { UploadRequirements } from '../../common/CreatorHub/UploadRequirements';
import AIAssistantPanel from '../../common/AIAssistantPanel';
import AIThumbnailPanel from '../../common/AIThumbnailPanel';
import RichTextEditor from '../../common/RichTextEditor';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';
import { useAIthumbnail } from '../../../hooks/useAIthumbnail';

interface VisibilityOption {
  id: 'public' | 'private';
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
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showAIThumbnailPanel, setShowAIThumbnailPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const uploadQueue = useUploadQueueContext();
  const [queueLocalId, setQueueLocalId] = useState<string | null>(null);
  const queuedEntry = queueLocalId
    ? (uploadQueue.entries.find((entry) => entry.localId === queueLocalId) ?? null)
    : null;
  // Stable across renders (useCallback in the hook), so it is safe in deps.
  const updateQueueMetadata = uploadQueue.updateMetadata;
  const parkThumbnail = uploadQueue.setPendingThumbnail;

  // `URL.createObjectURL` in the JSX would mint a new blob URL on every render
  // and never revoke any of them, pinning the whole file in memory each time.
  useEffect(() => {
    if (!selectedFile) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const { channels, selectedChannelId, selectedChannel } = useChannelSelection();
  const navigate = useNavigate();
  const [channelError, setChannelError] = useState<string | null>(null);
  
  // Add AI Thumbnail hook
  const { 
    generateForVideo, 
    isGeneratingForVideo,
    generateFromPrompt,
    isGeneratingFromPrompt,
    generateWithReference,
    isGeneratingWithReference,
    refineThumbnail,
    isRefiningThumbnail
  } = useAIthumbnail();

  useEffect(() => {
    if (step === 2) {
      if (!selectedChannelId) {
        setChannelError('Please select a channel to upload to');
      } else if (!channels.find(c => c.id.toString() === selectedChannelId.toString())) {
        setChannelError('Selected channel is invalid');
      } else {
        setChannelError(null);
      }
    }
  }, [selectedChannelId, channels, step]);

  const visibilityOptions: VisibilityOption[] = [
    { id: 'public', icon: Globe2, label: 'Public', description: 'Everyone can watch this video' },
    { id: 'private', icon: Lock, label: 'Private', description: 'Only you can watch this video' },
  ];

  /**
   * The transfer starts the moment a file is chosen — the metadata form is
   * filled in while the bytes are already moving, which is the whole point of
   * the direct-to-storage upload queue.
   */
  const acceptFile = async (file: File) => {
    if (!selectedChannelId) {
      showErrorToast(uploadErrors.noChannel);
      return;
    }

    const result = await uploadQueue.enqueueFiles([file], Number(selectedChannelId));
    const created = result.accepted[0];
    if (!created) {
      showErrorToast(result.rejected[0]?.message ?? 'This file cannot be uploaded.');
      return;
    }
    setQueueLocalId(created.localId);
    setTitle(created.title);
    setSelectedFile(file);
    setStep(2);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      void acceptFile(file);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        console.error('Invalid file type:', file.type);
        alert('Please upload a valid video file.');
        return;
      }

      void acceptFile(file);
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

      // The Video row usually does not exist yet, so the queue holds the file
      // and applies it the moment `videoId` appears — even if the creator has
      // navigated away by then (the queue lives above the router).
      if (queueLocalId) parkThumbnail(queueLocalId, file);
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

  /**
   * The bytes are already on their way, so this button only settles the draft
   * metadata still sitting in the debounce, then hands the creator over to
   * Videos Management.
   */
  const handleDone = async () => {
    // The thumbnail is already parked with the queue, which applies it as soon
    // as the video row exists — including after this component unmounts. All
    // this button owes is the draft metadata the debounce may still be holding.
    if (queueLocalId) await uploadQueue.flushMetadata(queueLocalId);
    navigate('/creator-hub/videos');
  };

  // The draft metadata lives on the upload row until the worker creates the
  // Video, so every edit is mirrored to the upload (the hook debounces the
  // actual PATCH).
  useEffect(() => {
    if (!queueLocalId) return;
    updateQueueMetadata(queueLocalId, {
      title,
      description,
      isPublic: visibility === 'public',
      tags: tags.trim()
        ? tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : null,
    });
  }, [queueLocalId, updateQueueMetadata, title, description, tags, visibility]);

  // The success screen is only honest once the backend says the video is
  // playable; "the bytes arrived" is not the same thing.
  const queuedVideoStatus = queuedEntry?.videoStatus ?? null;
  const queuedVideoId = queuedEntry?.videoId ?? null;
  useEffect(() => {
    if (queuedVideoStatus !== 'processed') return;
    setUploadedVideoId(queuedVideoId === null ? null : String(queuedVideoId));
    setUploadProgress(100);
    setStep(4);
  }, [queuedVideoStatus, queuedVideoId]);

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

  // Add handler for applying generated thumbnails
  const handleApplyAIThumbnail = (thumbnailUrl: string) => {
    setThumbnailPreview(thumbnailUrl);
    // Fetch the image and convert to File object
    fetch(thumbnailUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'ai-thumbnail.jpg', { type: 'image/jpeg' });
        if (queueLocalId) parkThumbnail(queueLocalId, file);
      })
      .catch(error => {
        console.error('Error fetching thumbnail:', error);
        showErrorToast('Failed to apply AI thumbnail');
      });
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
                    src={videoPreviewUrl ?? ''}
                    controls
                    className="w-full aspect-video"
                  />
                </div>
              </div>

              {/* Thumbnail Card - Updated with improved UI */}
              <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h2 className="text-xl font-medium text-white mb-6">Thumbnail</h2>
                
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black/50 mb-6 group">
                  {thumbnailPreview ? (
                    <>
                    <img
                      src={thumbnailPreview}
                      alt="Video thumbnail"
                        className="w-full h-full object-cover transition-all duration-300"
                    />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={() => document.getElementById('thumbnail-upload')?.click()}
                          className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors mx-2"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => {
                            setThumbnailPreview(null);
                            if (queueLocalId) parkThumbnail(queueLocalId, null);
                          }}
                          className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors mx-2"
                        >
                          Remove
                        </button>
                      </div>
                    </>
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

                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-white rounded-lg font-medium transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Image
                    </button>
                    
                    <button
                      onClick={() => setShowAIThumbnailPanel(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#fa7517]/90 to-[#ff8c3a]/90 hover:from-[#fa7517] hover:to-[#ff8c3a] text-black rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:shadow-[#fa7517]/20"
                    >
                      <Sparkles className="w-5 h-5" />
                      AI Generator
                    </button>
                  </div>
                  
                  <div className="bg-[#fa7517]/10 rounded-lg p-4 border border-[#fa7517]/20">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <Sparkles className="w-5 h-5 text-[#fa7517]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">AI Thumbnail Generator</p>
                        <p className="text-gray-400 text-sm mt-1">Create eye-catching thumbnails powered by AI to increase your video's click-through rate.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </div>

              {/* Upload Requirements */}
              <UploadRequirements />
            </div>

            {/* Right Column - Video Details Form - Takes 4 columns */}
            <div className="lg:col-span-4 space-y-8">
              {/* Channel Selection with simplified UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Channel Selection</h3>
                    <p className="text-sm text-gray-400">Choose which channel to upload your video to</p>
                  </div>
                  {channelError && (
                    <span className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {channelError}
                    </span>
                  )}
                </div>

                <div className={`
                  relative rounded-xl overflow-hidden
                  ${channelError ? 'ring-2 ring-red-500' : 'ring-1 ring-gray-800/30 hover:ring-[#fa7517]/30'}
                  transition-all duration-300 group
                `}>
                  {/* Channel Banner with Selector */}
                  <div className="relative">
                    <ChannelSelector />
                  </div>
                </div>

                {/* Helper Text */}
                <p className="text-sm text-gray-400">
                  Your video will be published to the selected channel. You can change this selection at any time before uploading.
                </p>
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

                {/* Visibility Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white">
                    Video Visibility
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = visibility === option.id;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => setVisibility(option.id)}
                          className={`
                            p-4 rounded-xl border transition-all duration-300
                            flex items-start gap-3 text-left
                            ${
                              isSelected 
                                ? 'border-[#fa7517] bg-[#fa7517]/10' 
                                : 'border-gray-800/30 hover:border-gray-700/50 bg-black/20'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-[#fa7517]' : 'text-gray-400'}`} />
                          <div>
                            <p className={`font-medium ${isSelected ? 'text-[#fa7517]' : 'text-white'}`}>
                              {option.label}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Publish / Done */}
                <div className="pt-4 border-t border-gray-800/30">
                  {queuedEntry && (
                    <div className="mb-4 p-4 rounded-lg bg-black/40 border border-gray-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-300 truncate">{queuedEntry.filename}</p>
                        <span className="text-sm text-[#fa7517]">{queuedEntry.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-[#fa7517] transition-all"
                          style={{ width: `${queuedEntry.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {queuedEntry.errorMessage
                          ? queuedEntry.errorMessage
                          : queuedEntry.videoStatus === 'processed'
                            ? 'Ready to watch.'
                            : 'Uploading in the background — you can keep editing these details.'}
                      </p>
                    </div>
                  )}
                  <motion.button
                    onClick={handleDone}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-[#fa7517] hover:bg-[#ff8c3a] text-black 
                             rounded-lg font-medium text-lg transition-colors
                             flex items-center justify-center gap-3"
                  >
                    <Upload className="w-6 h-6" />
                    Done
                  </motion.button>
                  {/* Optional helper text */}
                  <p className="text-sm text-gray-400 text-center mt-3">
                    Your video keeps uploading in the background. Track it in Videos Management.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <VideoUploadSuccess
            videoTitle={title}
            videoId={uploadedVideoId}
            uploadProgress={uploadProgress}
            onClose={() => {
              setStep(1);
              setSelectedFile(null);
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

          {step === 4 && (
            <VideoUploadSuccess
              videoTitle={title}
              videoId={uploadedVideoId}
              uploadProgress={uploadProgress}
              onClose={() => {
                setStep(1);
                setSelectedFile(null);
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

      <AIThumbnailPanel
        isOpen={showAIThumbnailPanel}
        onClose={() => setShowAIThumbnailPanel(false)}
        videoId={uploadedVideoId ? parseInt(uploadedVideoId) : undefined}
        videoTitle={title}
        videoDescription={description}
        onThumbnailGenerated={handleApplyAIThumbnail}
        isGeneratingForVideo={isGeneratingForVideo}
        isGeneratingFromPrompt={isGeneratingFromPrompt}
        isGeneratingWithReference={isGeneratingWithReference}
        isRefiningThumbnail={isRefiningThumbnail}
        generateForVideo={generateForVideo}
        generateFromPrompt={generateFromPrompt}
        generateWithReference={generateWithReference}
        refineThumbnail={refineThumbnail}
      />
    </motion.div>
  );
};

export default VideoUpload;
