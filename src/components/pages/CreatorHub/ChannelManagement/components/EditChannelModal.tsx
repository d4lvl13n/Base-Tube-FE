import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  updateChannel,
  validateChannelData,
  createChannelFormData,
} from '../../../../../api/channel';
import { EditChannelModalProps, FormFields, FormErrors } from '../types';
import RichTextEditor from '../../../../common/RichTextEditor';
import { UpdateChannelData, isValidHandle } from '../../../../../types/channel';
import { styles } from './editChannelModalStyles';

const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channel,
  isOpen,
  onClose,
  onUpdate,
}) => {
  // -------------------------------------------------------
  // 1. State
  // -------------------------------------------------------
  const [formData, setFormData] = useState<FormFields>({
    name: channel.name,
    handle: channel.handle.replace('.base', ''),
    description: channel.description || '',
    channel_image: undefined, // No new file by default
    facebook_link: channel.facebook_link || '',
    instagram_link: channel.instagram_link || '',
    twitter_link: channel.twitter_link || '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // -------------------------------------------------------
  // 2. Effects
  // -------------------------------------------------------
  // Whenever the channel prop changes, reset the form.
  useEffect(() => {
    setFormData({
      name: channel.name,
      handle: channel.handle.replace('.base', ''),
      description: channel.description || '',
      channel_image: undefined,
      facebook_link: channel.facebook_link || '',
      instagram_link: channel.instagram_link || '',
      twitter_link: channel.twitter_link || '',
    });
    setErrors({});
    setImagePreview(null);
  }, [channel]);

  // Cleanup the created image URL on unmount or re-render
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // -------------------------------------------------------
  // 3. Handlers
  // -------------------------------------------------------
  // Update 'description' via RichTextEditor
  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  // Handle user picking a new image file
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mimetype
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        channel_image: 'Invalid image file (must be an image).',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, channel_image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Channel name is required.';
    }
    if (!formData.handle.trim()) {
      newErrors.handle = 'Handle is required.';
    } else if (!isValidHandle(formData.handle)) {
      newErrors.handle = 'Invalid handle format.';
    }

    // Build an UpdateChannelData object
    const channelUpdateObj: UpdateChannelData = {
      name: formData.name.trim(),
      handle: formData.handle.trim(),
      description: formData.description.trim(),
      facebook_link: formData.facebook_link.trim() || undefined,
      instagram_link: formData.instagram_link.trim() || undefined,
      twitter_link: formData.twitter_link.trim() || undefined,
      ...(formData.channel_image ? { channel_image: formData.channel_image } : {}),
    };

    // Validate with existing logic
    const validationErrors = validateChannelData(channelUpdateObj);
    validationErrors.forEach((err) => {
      const lowerErr = err.toLowerCase();
      if (lowerErr.includes('name')) newErrors.name = err;
      if (lowerErr.includes('handle')) newErrors.handle = err;
      if (lowerErr.includes('image')) newErrors.channel_image = err;
      if (lowerErr.includes('facebook')) newErrors.facebook_link = err;
      if (lowerErr.includes('instagram')) newErrors.instagram_link = err;
      if (lowerErr.includes('twitter')) newErrors.twitter_link = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle saving the updated channel
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const channelUpdateObj: UpdateChannelData = {
        name: formData.name.trim(),
        handle: `${formData.handle.trim()}.base`,
        description: formData.description.trim(),
        facebook_link: formData.facebook_link.trim() || undefined,
        instagram_link: formData.instagram_link.trim() || undefined,
        twitter_link: formData.twitter_link.trim() || undefined,
        ...(formData.channel_image ? { channel_image: formData.channel_image } : {}),
      };

      // Convert to FormData and send
      const formDataToSubmit = createChannelFormData(channelUpdateObj);
      await updateChannel(channel.id.toString(), formDataToSubmit);

      toast.success('Channel updated successfully.');
      onUpdate();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update channel.';
      toast.error(message);
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update image preview handling to match the working components
  const currentChannelImage = channel.channel_image_url || null;

  // -------------------------------------------------------
  // 4. Render
  // -------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modal}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={onClose}
          />

          {/* Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.container}
          >
            <div className={styles.content}>
              {/* Header */}
              <div className={styles.header}>
                <h3 className={styles.title}>Edit Channel</h3>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={onClose}
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Channel Name */}
                <div className={styles.inputGroup}>
                  <label htmlFor="channelName" className={styles.label}>
                    Channel Name
                  </label>
                  <input
                    id="channelName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`${styles.input} ${
                      errors.name
                        ? 'border-red-500 focus:outline-none'
                        : 'border-gray-700 focus:border-[#fa7517]'
                    }`}
                  />
                  {errors.name && (
                    <p className={styles.errorText}>{errors.name}</p>
                  )}
                </div>

                {/* Handle Input with Helper Text */}
                <div className={styles.inputGroup}>
                  <label htmlFor="channelHandle" className={styles.label}>
                    Handle
                  </label>
                  <div className="relative">
                    <input
                      id="channelHandle"
                      type="text"
                      value={formData.handle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, handle: e.target.value }))
                      }
                      className={`${styles.input} ${
                        errors.handle
                          ? 'border-red-500 focus:outline-none'
                          : 'border-gray-700 focus:border-[#fa7517]'
                      }`}
                      placeholder="your-channel-handle"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      .base
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Handle can only contain letters, numbers, underscores, and hyphens
                  </p>
                  {errors.handle && (
                    <p className={styles.errorText}>{errors.handle}</p>
                  )}
                </div>

                {/* Description with RichTextEditor */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Description</label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter channel description..."
                    className="min-h-[200px]"
                  />
                  {errors.description && (
                    <p className={styles.errorText}>{errors.description}</p>
                  )}
                </div>

                {/* Channel Image */}
                <div>
                  <label className={styles.label}>Channel Image</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className={styles.imageWrapper}>
                      {(imagePreview || currentChannelImage) ? (
                        <img
                          src={imagePreview || currentChannelImage || ''}
                          alt="Channel Preview"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* File Input */}
                    <div>
                      <input
                        id="channelImageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={styles.fileInput}
                      />
                      <label
                        htmlFor="channelImageInput"
                        className={styles.fileButton}
                      >
                        Choose File
                      </label>
                      {errors.channel_image && (
                        <p className={styles.errorText}>
                          {errors.channel_image}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Facebook */}
                  <div>
                    <label
                      htmlFor="facebook"
                      className={`${styles.label} mb-1 block`}
                    >
                      Facebook
                    </label>
                    <input
                      id="facebook"
                      type="url"
                      placeholder="Facebook URL"
                      value={formData.facebook_link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          facebook_link: e.target.value,
                        }))
                      }
                      className={`${styles.input} ${
                        errors.facebook_link
                          ? 'border-red-500 focus:outline-none'
                          : 'border-gray-700 focus:border-[#fa7517]'
                      }`}
                    />
                    {errors.facebook_link && (
                      <p className={styles.errorText}>
                        {errors.facebook_link}
                      </p>
                    )}
                  </div>

                  {/* Instagram */}
                  <div>
                    <label
                      htmlFor="instagram"
                      className={`${styles.label} mb-1 block`}
                    >
                      Instagram
                    </label>
                    <input
                      id="instagram"
                      type="url"
                      placeholder="Instagram URL"
                      value={formData.instagram_link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          instagram_link: e.target.value,
                        }))
                      }
                      className={`${styles.input} ${
                        errors.instagram_link
                          ? 'border-red-500 focus:outline-none'
                          : 'border-gray-700 focus:border-[#fa7517]'
                      }`}
                    />
                    {errors.instagram_link && (
                      <p className={styles.errorText}>
                        {errors.instagram_link}
                      </p>
                    )}
                  </div>

                  {/* Twitter */}
                  <div>
                    <label
                      htmlFor="twitter"
                      className={`${styles.label} mb-1 block`}
                    >
                      Twitter
                    </label>
                    <input
                      id="twitter"
                      type="url"
                      placeholder="Twitter URL"
                      value={formData.twitter_link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          twitter_link: e.target.value,
                        }))
                      }
                      className={`${styles.input} ${
                        errors.twitter_link
                          ? 'border-red-500 focus:outline-none'
                          : 'border-gray-700 focus:border-[#fa7517]'
                      }`}
                    />
                    {errors.twitter_link && (
                      <p className={styles.errorText}>{errors.twitter_link}</p>
                    )}
                  </div>
                </div>

                {/* Submission Error */}
                {errors.submit && (
                  <p className={styles.errorText}>{errors.submit}</p>
                )}

                {/* Buttons */}
                <div className={styles.actionsContainer}>
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

export default EditChannelModal;