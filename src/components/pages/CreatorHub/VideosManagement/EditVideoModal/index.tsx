import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock3,
  FileVideo,
  Globe2,
  Heart,
  ImageIcon,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  Upload,
  Wand2,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '../../../../common/RichTextEditor';
import AIAssistantPanel from '../../../../common/AIAssistantPanel';
import AIThumbnailPanel from '../../../../common/AIThumbnailPanel';
import { generateVideoDescription, getVideoById } from '../../../../../api/video';
import { useAIthumbnail } from '../../../../../hooks/useAIthumbnail';
import { Video } from '../../../../../types/video';
import { EditVideoModalProps, FormErrors, FormFields, VisibilityOption } from './types';
import { styles } from './styles';

const MAX_VIDEO_FILE_SIZE = 2 * 1024 * 1024 * 1024;

const formatCount = (value?: number) => (value || 0).toLocaleString();

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
};

const formatDuration = (seconds?: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const getBestVideoUrl = (video?: Partial<Video> | null) => {
  const urls = video?.video_urls;
  return video?.video_url
    || urls?.original
    || urls?.['2160p']
    || urls?.['1440p']
    || urls?.['1080p']
    || urls?.['720p']
    || urls?.['480p']
    || urls?.['360p']
    || urls?.['240p']
    || '';
};

const getInitialFormData = (video: Video): FormFields => ({
  title: video.title || '',
  description: video.description || '',
  tags: video.tags || '',
  is_public: Boolean(video.is_public),
});

const EditVideoModal: React.FC<EditVideoModalProps> = ({
  video,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState<FormFields>(() => getInitialFormData(video));
  const [videoDetails, setVideoDetails] = useState<Video | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url || null);
  const [replacementVideoFile, setReplacementVideoFile] = useState<File | null>(null);
  const [replacementVideoPreview, setReplacementVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [isAIThumbnailPanelOpen, setIsAIThumbnailPanelOpen] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const {
    generateForVideo,
    generateFromPrompt,
    generateWithReference,
    isGeneratingForVideo,
    isGeneratingFromPrompt,
    isGeneratingWithReference,
    refineThumbnail,
    isRefiningThumbnail
  } = useAIthumbnail();

  useEffect(() => {
    setFormData(getInitialFormData(video));
    setThumbnailFile(null);
    setThumbnailPreview(video.thumbnail_url || null);
    setReplacementVideoFile(null);
    setReplacementVideoPreview(null);
    setGeneratedDescription(undefined);
    setSuggestedTitle(undefined);
    setErrors({});
  }, [video]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingDetails(true);
    setDetailsError(null);

    getVideoById(video.id.toString())
      .then((details) => {
        if (isMounted) setVideoDetails(details);
      })
      .catch((error) => {
        if (isMounted) {
          setDetailsError(error instanceof Error ? error.message : 'Unable to load video preview');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, video.id]);

  useEffect(() => {
    return () => {
      if (replacementVideoPreview?.startsWith('blob:')) URL.revokeObjectURL(replacementVideoPreview);
    };
  }, [replacementVideoPreview]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const activeVideo = videoDetails || video;
  const currentVideoUrl = useMemo(() => getBestVideoUrl(activeVideo), [activeVideo]);
  const previewVideoUrl = replacementVideoPreview || currentVideoUrl;

  const descriptionText = useMemo(() => stripHtml(formData.description), [formData.description]);
  const hasChanges = useMemo(() => {
    const initial = getInitialFormData(video);
    return formData.title !== initial.title
      || formData.description !== initial.description
      || formData.tags !== initial.tags
      || formData.is_public !== initial.is_public
      || Boolean(thumbnailFile)
      || Boolean(replacementVideoFile);
  }, [formData, replacementVideoFile, thumbnailFile, video]);

  const visibilityOptions: VisibilityOption[] = [
    { id: 'public', icon: Globe2, label: 'Public', description: 'Available to viewers' },
    { id: 'private', icon: Lock, label: 'Private', description: 'Hidden from viewers' },
  ];

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!descriptionText) newErrors.description = 'Description is required';
    if (thumbnailFile && !thumbnailFile.type.startsWith('image/')) newErrors.thumbnail = 'Invalid image file';
    if (replacementVideoFile && !replacementVideoFile.type.startsWith('video/')) {
      newErrors.video = 'Invalid video file';
    }
    if (replacementVideoFile && replacementVideoFile.size > MAX_VIDEO_FILE_SIZE) {
      newErrors.video = 'Video file must be under 2GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append('description', formData.description);
    submitData.append('tags', formData.tags);
    submitData.append('is_public', formData.is_public.toString());
    if (thumbnailFile) submitData.append('thumbnail', thumbnailFile);
    if (replacementVideoFile) submitData.append('video', replacementVideoFile);

    try {
      await onUpdate(video.id.toString(), submitData);
      toast.success(replacementVideoFile ? 'Video saved and queued for processing' : 'Video saved');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video';
      setErrors(prev => ({ ...prev, submit: message }));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyReplacementVideo = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrors(prev => ({ ...prev, video: 'Invalid video file' }));
      return;
    }
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      setErrors(prev => ({ ...prev, video: 'Video file must be under 2GB' }));
      return;
    }

    if (replacementVideoPreview?.startsWith('blob:')) URL.revokeObjectURL(replacementVideoPreview);
    setReplacementVideoFile(file);
    setReplacementVideoPreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, video: undefined }));
  };

  const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) applyReplacementVideo(file);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, thumbnail: 'Invalid image file' }));
      return;
    }

    if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, thumbnail: undefined }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    try {
      const { description: generated, suggestedTitle } =
        await generateVideoDescription(formData.title, keywords, additionalInfo);

      setGeneratedDescription(generated);
      setSuggestedTitle(suggestedTitle);
      setFormData(prev => ({ ...prev, description: generated }));
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    fetch(thumbnailUrl)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], `ai-thumbnail-${Date.now()}.png`, { type: blob.type || 'image/png' });
        setThumbnailFile(file);
        setThumbnailPreview(thumbnailUrl);
        setErrors(prev => ({ ...prev, thumbnail: undefined }));
        toast.success('Thumbnail applied');
      })
      .catch(() => {
        toast.error('Failed to apply AI thumbnail');
      });
  };

  const resetChanges = () => {
    setFormData(getInitialFormData(video));
    setThumbnailFile(null);
    setThumbnailPreview(video.thumbnail_url || null);
    setReplacementVideoFile(null);
    setReplacementVideoPreview(null);
    setErrors({});
  };

  const statusLabel = String(activeVideo.status || 'completed').replace('_', ' ');

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.workspace}
    >
      <div className={styles.topBar}>
        <button type="button" onClick={onClose} className={styles.backButton}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-2xl font-semibold text-white truncate">
              {formData.title || 'Untitled video'}
            </h1>
            <span className={styles.statusPill}>{statusLabel}</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Last updated {formatDate(activeVideo.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button type="button" onClick={resetChanges} className={styles.secondaryButton} disabled={isSubmitting}>
              <X className="w-4 h-4" />
              Discard
            </button>
          )}
          <button type="submit" className={styles.primaryButton} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <section className="space-y-5">
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Preview</p>
                <h2 className={styles.panelTitle}>Video asset</h2>
              </div>
              {replacementVideoFile && (
                <span className={styles.warningPill}>replacement queued</span>
              )}
            </div>

            <div className={styles.videoPreview}>
              {previewVideoUrl ? (
                <video
                  src={previewVideoUrl}
                  poster={thumbnailPreview || undefined}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className={styles.previewFallback}>
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Current thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <FileVideo className="w-8 h-8 text-gray-500" />
                      <p className="text-sm text-gray-500">Preview unavailable</p>
                    </>
                  )}
                </div>
              )}

              {isLoadingDetails && (
                <div className={styles.previewOverlay}>
                  <RefreshCw className="w-5 h-5 animate-spin text-[#fa7517]" />
                </div>
              )}
            </div>

            {detailsError && (
              <div className={styles.errorNote}>
                <AlertTriangle className="w-4 h-4" />
                {detailsError}
              </div>
            )}

            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
            <div
              className={styles.dropZone}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) applyReplacementVideo(file);
              }}
              onClick={() => videoInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-[#fa7517]" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {replacementVideoFile ? replacementVideoFile.name : 'Replace source video'}
                </p>
                <p className="text-xs text-gray-500">
                  {replacementVideoFile ? formatFileSize(replacementVideoFile.size) : 'MP4, MOV or WebM up to 2GB'}
                </p>
              </div>
            </div>
            {errors.video && <p className={styles.errorText}>{errors.video}</p>}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Artwork</p>
                <h2 className={styles.panelTitle}>Thumbnail</h2>
              </div>
              <button type="button" onClick={() => setIsAIThumbnailPanelOpen(true)} className={styles.toolButton}>
                <Wand2 className="w-4 h-4" />
                AI
              </button>
            </div>

            <div className={styles.thumbnailFrame}>
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Video thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className={styles.thumbnailEmpty}>
                  <ImageIcon className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>

            <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => thumbnailInputRef.current?.click()} className={styles.secondaryButton}>
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button type="button" onClick={() => setIsAIThumbnailPanelOpen(true)} className={styles.secondaryButton}>
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
            </div>
            {errors.thumbnail && <p className={styles.errorText}>{errors.thumbnail}</p>}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statTile}>
              <BarChart3 className="w-4 h-4 text-[#fa7517]" />
              <span>{formatCount(activeVideo.views_count)}</span>
              <small>views</small>
            </div>
            <div className={styles.statTile}>
              <Heart className="w-4 h-4 text-[#fa7517]" />
              <span>{formatCount(activeVideo.likes_count)}</span>
              <small>likes</small>
            </div>
            <div className={styles.statTile}>
              <MessageSquare className="w-4 h-4 text-[#fa7517]" />
              <span>{formatCount(activeVideo.comment_count)}</span>
              <small>comments</small>
            </div>
            <div className={styles.statTile}>
              <Clock3 className="w-4 h-4 text-[#fa7517]" />
              <span>{formatDuration(activeVideo.duration)}</span>
              <small>duration</small>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Metadata</p>
              <h2 className={styles.panelTitle}>Publishing details</h2>
            </div>
            <button type="button" onClick={() => setIsAIPanelOpen(true)} className={styles.toolButton}>
              <Sparkles className="w-4 h-4" />
              Assistant
            </button>
          </div>

          <div className="space-y-6">
            <div className={styles.inputGroup}>
              <label htmlFor="video-title" className={styles.label}>Title</label>
              <input
                id="video-title"
                type="text"
                value={formData.title}
                onChange={(event) => setFormData(prev => ({ ...prev, title: event.target.value }))}
                className={`${styles.input} ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Video title"
              />
              {errors.title && <p className={styles.errorText}>{errors.title}</p>}
            </div>

            <div className={styles.inputGroup}>
              <div className="flex items-center justify-between gap-3">
                <label className={styles.label}>Description</label>
                <button type="button" onClick={() => setIsAIPanelOpen(true)} className={styles.inlineAction}>
                  <Sparkles className="w-4 h-4" />
                  Improve
                </button>
              </div>
              <RichTextEditor
                content={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Describe the video..."
                minHeight="360px"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{descriptionText.length.toLocaleString()} characters</span>
                {generatedDescription && <span>AI draft applied</span>}
              </div>
              {errors.description && <p className={styles.errorText}>{errors.description}</p>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="video-tags" className={styles.label}>Tags</label>
              <div className={styles.tagInput}>
                <Tag className="w-4 h-4 text-gray-500" />
                <input
                  id="video-tags"
                  type="text"
                  value={formData.tags}
                  onChange={(event) => setFormData(prev => ({ ...prev, tags: event.target.value }))}
                  className="w-full bg-transparent text-white focus:outline-none"
                  placeholder="gaming, tutorial, launch"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Visibility</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = option.id === 'public' ? formData.is_public : !formData.is_public;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_public: option.id === 'public' }))}
                      className={`${styles.visibilityOption} ${selected ? styles.visibilityOptionActive : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-[#fa7517]' : 'text-gray-500'}`} />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.metaStrip}>
              <div>
                <Calendar className="w-4 h-4 text-gray-500" />
                Created {formatDate(activeVideo.createdAt)}
              </div>
              <div>
                <FileVideo className="w-4 h-4 text-gray-500" />
                Channel #{activeVideo.channel_id}
              </div>
            </div>

            {replacementVideoFile && (
              <div className={styles.warningBox}>
                <AlertTriangle className="w-5 h-5 text-[#fa7517]" />
                <p>Saving with a replacement file will queue this video for processing again.</p>
              </div>
            )}

            {errors.submit && <p className={styles.errorText}>{errors.submit}</p>}
          </div>
        </section>
      </div>

      <AIAssistantPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        title={formData.title}
        keywords={keywords}
        additionalInfo={additionalInfo}
        onKeywordsChange={setKeywords}
        onAdditionalInfoChange={setAdditionalInfo}
        onGenerate={handleGenerateDescription}
        isGenerating={isGenerating}
        suggestedTitle={suggestedTitle}
        generatedDescription={generatedDescription}
        onAcceptTitle={() => {
          if (suggestedTitle) setFormData(prev => ({ ...prev, title: suggestedTitle }));
          setSuggestedTitle(undefined);
        }}
        mode="video"
      />

      <AIThumbnailPanel
        isOpen={isAIThumbnailPanelOpen}
        onClose={() => setIsAIThumbnailPanelOpen(false)}
        videoId={video.id}
        videoTitle={formData.title}
        videoDescription={formData.description}
        onThumbnailGenerated={handleThumbnailGenerated}
        isGeneratingForVideo={isGeneratingForVideo}
        isGeneratingFromPrompt={isGeneratingFromPrompt}
        isGeneratingWithReference={isGeneratingWithReference}
        isRefiningThumbnail={isRefiningThumbnail}
        generateForVideo={generateForVideo}
        generateFromPrompt={generateFromPrompt}
        generateWithReference={generateWithReference}
        refineThumbnail={refineThumbnail}
      />
    </motion.form>
  );
};

export default EditVideoModal;
