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
  CheckCircle2,
  X,
} from 'lucide-react';
import { uploadVideo } from '../../../api/video';
import { useChannels } from '../../../context/ChannelContext';

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

  const { channels } = useChannels();

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
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setStep(2);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setThumbnailPreview(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file for the thumbnail.');
    }
  };

  const handlePublish = async () => {
    if (!selectedFile) {
      alert('Please select a video file.');
      return;
    }
    if (!selectedChannelId) {
      alert('Please select a channel.');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a title for your video.');
      return;
    }

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
      setUploadProgress(0);
      setStep(3); // Show upload progress

      await uploadVideo(formData, (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      // Handle success
      setStep(4);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
      setStep(2); // Go back to the details form
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
                    placeholder="Enter video description"
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
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-[#fa7517] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
            <p className="text-gray-400 mb-6">
              Your video has been uploaded and is now processing.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedFile(null);
                  setThumbnailFile(null);
                  setThumbnailPreview(null);
                  setTitle('');
                  setDescription('');
                  setTags('');
                  setUploadProgress(0);
                }}
                className="px-6 py-2 rounded-lg border border-gray-800/30 hover:bg-gray-800/50 transition-colors text-white font-medium"
              >
                Upload Another Video
              </button>
              <button
                onClick={() => {
                  // Navigate to the user's videos or dashboard
                }}
                className="px-6 py-2 bg-[#fa7517] hover:bg-[#ff8c3a] transition-colors rounded-lg text-black font-medium"
              >
                Go to My Videos
              </button>
            </div>
          </motion.div>
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
    </div>
  );
};

export default VideoUpload;