// src/components/pages/VideoUpload.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { uploadVideo, generateVideoDescription } from '../../../api/video';
import { useChannels } from '../../../context/ChannelContext';
import VideoUploadSuccess from '../../common/ModalScreen/VideoUploadSuccess';
import { useNavigate } from 'react-router-dom';
import AIAssistantPanel from '../../common/AIAssistantPanel';
import RichTextEditor from '../../common/RichTextEditor';

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

  const handlePublish = async () => {
    console.log('Starting video upload process...');
    
    if (!selectedFile) {
      console.error('Upload failed: No video file selected');
      alert('Please select a video file.');
      return;
    }
    
    if (!selectedChannelId) {
      console.error('Upload failed: No channel selected');
      alert('Please select a channel.');
      return;
    }
    
    if (!title.trim()) {
      console.error('Upload failed: No title provided');
      alert('Please enter a title for your video.');
      return;
    }

    console.log('Upload preparation:', {
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`,
      fileType: selectedFile.type,
      channelId: selectedChannelId,
      hasThumbnail: !!thumbnailFile,
      visibility
    });

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

    try {
      console.log('Starting upload to server...');
      setUploadProgress(0);
      setStep(3); // Show upload progress

      const response = await uploadVideo(formData, (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      });

      console.log('Upload completed successfully:', {
        videoId: response.data.id,
        status: response.status
      });

      setUploadedVideoId(response.data.id);
      setStep(4);
    } catch (error: any) {
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
            className="w-full space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Preview */}
              <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#fa7517]" />
                  Video Preview
                </h3>
                <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center">
                  {selectedFile && (
                    <video
                      src={URL.createObjectURL(selectedFile)}
                      controls
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#fa7517]" />
                  Thumbnail
                </h3>
                <div
                  className="aspect-video bg-gray-900/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => {
                    const inputElement = document.getElementById('thumbnail-upload');
                    if (inputElement) {
                      inputElement.click();
                    }
                  }}
                >
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Upload thumbnail</p>
                    </>
                  )}
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
              </div>
            </div>

            {/* Video Details Form */}
            <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
                    placeholder="Enter video title"
                  />
                </div>

                {/* Description section with AI assistant */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-200">
                      Description
                    </label>
                    <motion.button
                      type="button"
                      onClick={() => setIsAIPanelOpen(true)}
                      className="flex items-center space-x-2 text-[#fa7517] hover:text-[#ff8c3a] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">AI Assistant</span>
                    </motion.button>
                  </div>

                  <RichTextEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Tell viewers about your video..."
                    minHeight="200px"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800/30 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="flex-1 bg-transparent focus:outline-none text-white"
                      placeholder="Add tags (separated by commas)"
                    />
                  </div>
                </div>

                {/* Channel Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Channel</label>
                  <select
                    value={selectedChannelId || ''}
                    onChange={(e) => setSelectedChannelId(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
                  >
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4">Visibility</label>
                  <div className="grid gap-4">
                    {visibilityOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`
                          flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors
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
                          onChange={(e) =>
                            setVisibility(e.target.value as 'public' | 'unlisted' | 'private')
                          }
                          className="hidden"
                        />
                        <option.icon
                          className={`w-5 h-5 ${
                            visibility === option.id ? 'text-[#fa7517]' : 'text-gray-400'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-white">{option.label}</p>
                          <p className="text-sm text-gray-400">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-200">
                Please ensure your content complies with our community guidelines.
                Videos that violate our policies may be removed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedFile(null);
                  setThumbnailFile(null);
                  setThumbnailPreview(null);
                }}
                className="px-6 py-2 rounded-lg border border-gray-800/30 hover:bg-gray-800/50 transition-colors text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-6 py-2 bg-[#fa7517] hover:bg-[#ff8c3a] transition-colors rounded-lg text-black font-medium"
              >
                Publish Video
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
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
                  <p className="text-sm text-gray-400">Uploading video...</p>
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedFile(null);
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
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
                  className="absolute left-0 top-0 h-full bg-[#fa7517]"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{uploadProgress}% uploaded</p>
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Upload Video
        </h1>
        <p className="text-gray-400 mt-2">Share your content with the world</p>
      </motion.div>

      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

      {/* Move AIAssistantPanel here, at the root level */}
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
    </div>
  );
};

export default VideoUpload;