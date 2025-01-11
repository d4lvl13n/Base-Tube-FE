import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Globe2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '../../../../common/RichTextEditor';
import { EditVideoModalProps, FormErrors, FormFields, VisibilityOption } from './types';
import { styles } from './styles';

const EditVideoModal: React.FC<EditVideoModalProps> = ({
  video,
  isOpen,
  onClose,
  onUpdate
}) => {
  // Form state
  const [formData, setFormData] = useState<FormFields>({
    title: video.title,
    description: video.description,
    tags: video.tags || '',
    is_public: video.is_public,
  });
  
  // UI state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Cleanup function for thumbnail preview
  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview !== video.thumbnail_url) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview, video.thumbnail_url]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (thumbnailFile && !thumbnailFile.type.startsWith('image/')) {
      newErrors.thumbnail = 'Invalid image file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const submitData = new FormData();
    
    // Always append all fields to ensure proper update
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('tags', formData.tags);
    submitData.append('is_public', formData.is_public.toString());
    if (thumbnailFile) {
      submitData.append('thumbnail', thumbnailFile);
    }

    try {
      await onUpdate(video.id.toString(), submitData);
      toast.success('Video updated successfully');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video';
      toast.error(message);
      setErrors(prev => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle thumbnail change
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, thumbnail: 'Invalid image file' }));
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, thumbnail: undefined }));
    }
  };

  const visibilityOptions: VisibilityOption[] = [
    { id: 'public', icon: Globe2, label: 'Public', description: 'Anyone can watch this video' },
    { id: 'private', icon: Lock, label: 'Private', description: 'Only you can watch' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modal}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.container}
          >
            <div className={styles.content}>
              <div className={styles.header}>
                <h2 className={styles.title}>Edit Video</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Title */}
                <div className={styles.inputGroup}>
                  <label htmlFor="title" className={styles.label}>
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`${styles.input} ${errors.title ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.title && (
                    <span className="text-sm text-red-500">{errors.title}</span>
                  )}
                </div>

                {/* Tags */}
                <div className={styles.inputGroup}>
                  <label htmlFor="tags" className={styles.label}>
                    Tags (comma separated)
                  </label>
                  <input
                    id="tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className={styles.input}
                    placeholder="gaming, tutorial, vlog"
                  />
                </div>

                {/* Two-column layout for Description and Thumbnail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div>
                    <label className={styles.label}>Description</label>
                    <RichTextEditor
                      content={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Describe your video..."
                      minHeight="150px"
                    />
                    {errors.description && (
                      <span className="text-sm text-red-500">{errors.description}</span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className={styles.label}>Thumbnail</label>
                    <div
                      className={`h-48 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors ${errors.thumbnail ? 'border border-red-500' : ''}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label htmlFor="thumbnail-upload" className="block w-full h-full">
                        {thumbnailPreview ? (
                          <img
                            src={thumbnailPreview}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-2">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              Click to upload thumbnail
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    {errors.thumbnail && (
                      <span className="text-sm text-red-500">{errors.thumbnail}</span>
                    )}
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Visibility</label>
                  <div className="grid grid-cols-2 gap-4">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, is_public: option.id === 'public' }))}
                          className={`p-4 rounded-lg border ${
                            (option.id === 'public' ? formData.is_public : !formData.is_public)
                              ? 'border-[#fa7517] bg-[#fa7517]/10'
                              : 'border-gray-800/30 bg-gray-900/50'
                          } transition-colors`}
                        >
                          <Icon className="w-5 h-5 mb-2 mx-auto" />
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-gray-400">
                            {option.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.cancelButton}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditVideoModal; 