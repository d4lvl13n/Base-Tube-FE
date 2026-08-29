import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  AlertTriangle,
  ArrowLeft,
  ImageIcon,
  Play,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import RichTextEditor from '../../../../common/RichTextEditor';
import AIAssistantPanel from '../../../../common/AIAssistantPanel';
import AIThumbnailPanel from '../../../../common/AIThumbnailPanel';
import { generateVideoDescription, getVideoById } from '../../../../../api/video';
import { useAIthumbnail } from '../../../../../hooks/useAIthumbnail';
import { Video, VideoStatus } from '../../../../../types/video';
import { VisibilitySwitch } from '../components/VideoList/VisibilitySwitch';
import { isPlayable } from '../components/VideoList/utils';
import { EditVideoModalProps, FormErrors, FormFields } from './types';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { statusPill, styles } from './styles';

/** Long enough for anything anyone would read; short enough to be a title. */
const MAX_TITLE_LENGTH = 100;

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

const formatDuration = (seconds?: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  const padded = secs.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${padded}`;
  return `${mins}:${padded}`;
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

/** Quality ladder, tallest first — the best rendition is the one on offer. */
const QUALITY_ORDER = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p'] as const;

/**
 * The resolution to show, when there is one to show.
 *
 * The API sends no width/height, but it does say which renditions exist, and
 * the tallest of those is what a viewer would get. No renditions means we do
 * not know — so the meta row simply does not claim to.
 */
const getResolution = (video?: Partial<Video> | null): string | null => {
  const urls = video?.video_urls;
  if (!urls) return null;
  return QUALITY_ORDER.find((quality) => Boolean(urls[quality])) ?? null;
};

/** Processed / Processing / Failed — the three states a creator can act on. */
export function statusLabel(status?: VideoStatus): 'Processed' | 'Processing' | 'Failed' {
  if (status === 'failed') return 'Failed';
  if (status === 'processed' || status === 'completed') return 'Processed';
  return 'Processing';
}

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
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState<FormFields>(() => getInitialFormData(video));
  const [videoDetails, setVideoDetails] = useState<Video | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [isAIThumbnailPanelOpen, setIsAIThumbnailPanelOpen] = useState(false);

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
    setGeneratedDescription(undefined);
    setSuggestedTitle(undefined);
    setIsPreviewPlaying(false);
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
      if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const activeVideo = videoDetails || video;
  const previewVideoUrl = useMemo(() => getBestVideoUrl(activeVideo), [activeVideo]);
  const resolution = useMemo(() => getResolution(activeVideo), [activeVideo]);
  const uploadedOn = formatDate(activeVideo.createdAt);
  const updatedOn = formatDate(activeVideo.updatedAt);
  const canPublish = isPlayable(activeVideo.status);

  const descriptionText = useMemo(() => stripHtml(formData.description), [formData.description]);
  const hasChanges = useMemo(() => {
    const initial = getInitialFormData(video);
    return formData.title !== initial.title
      || formData.description !== initial.description
      || formData.tags !== initial.tags
      || formData.is_public !== initial.is_public
      || Boolean(thumbnailFile);
  }, [formData, thumbnailFile, video]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!descriptionText) newErrors.description = 'Description is required';
    if (thumbnailFile && !thumbnailFile.type.startsWith('image/')) {
      newErrors.thumbnail = 'Invalid image file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [descriptionText, formData.title, thumbnailFile]);

  /**
   * The save itself, reachable from the button and from the keyboard.
   *
   * Deliberately not `form.requestSubmit()`: it is the right DOM call and it
   * is missing from enough of the environments this has to run in — including
   * the one the tests use — that routing both paths through the same function
   * is simply more honest than feature-detecting a submit.
   */
  const submit = useCallback(async () => {
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    // `PUT /videos/:id` parses a thumbnail and nothing else; a `video` field is
    // rejected outright. Replacing the file is Content Studio's job.
    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append('description', formData.description);
    submitData.append('tags', formData.tags);
    submitData.append('is_public', formData.is_public.toString());
    if (thumbnailFile) submitData.append('thumbnail', thumbnailFile);

    try {
      await onUpdate(video.id.toString(), submitData);
      toast.success('Video saved');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video';
      setErrors(prev => ({ ...prev, submit: message }));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, onClose, onUpdate, thumbnailFile, validateForm, video.id]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submit();
  };

  // ⌘S / Ctrl-S saves. The browser's own "save page" is never what a creator
  // means with a form in front of them.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (!hasChanges) return;
      void submit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasChanges, isOpen, submit]);

  // Closing the tab is the one exit React cannot intercept, so it gets the
  // browser's own guard.
  useEffect(() => {
    if (!hasChanges) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [hasChanges]);

  const requestClose = useCallback(() => {
    if (hasChanges) {
      setIsLeaveDialogOpen(true);
      return;
    }
    onClose();
  }, [hasChanges, onClose]);

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
      const { description: generated, suggestedTitle: nextTitle } =
        await generateVideoDescription(formData.title, keywords, additionalInfo);

      setGeneratedDescription(generated);
      setSuggestedTitle(nextTitle);
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
    setErrors({});
  };

  const phase = statusLabel(activeVideo.status);
  const meta = [
    formatDuration(activeVideo.duration),
    resolution,
    uploadedOn ? `Uploaded ${uploadedOn}` : null,
  ].filter(Boolean) as string[];

  if (!isOpen) return null;

  return (
    <Tooltip.Provider delayDuration={300}>
      <form onSubmit={handleSubmit} className={styles.page}>
        <header className={styles.header}>
          <button type="button" onClick={requestClose} className={styles.ghostButton}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-sm font-medium text-gray-100">
              {formData.title || 'Untitled video'}
            </h1>
            <span
              className={`${statusPill.base} ${
                phase === 'Processed'
                  ? statusPill.processed
                  : phase === 'Failed'
                    ? statusPill.failed
                    : statusPill.processing
              }`}
            >
              {phase}
            </span>
            {updatedOn && (
              <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
                Updated {updatedOn}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fa7517]" aria-hidden="true" />
                <span className="hidden md:inline">Unsaved changes</span>
              </span>
            )}
            {hasChanges && (
              <button
                type="button"
                onClick={resetChanges}
                className={styles.ghostButton}
                disabled={isSubmitting}
              >
                Discard
              </button>
            )}
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting || !hasChanges}>
              {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Saving' : 'Save'}
            </button>
          </div>
        </header>

        <div className={styles.grid}>
          {/* ── Details ─────────────────────────────────────────────────── */}
          <section className={`${styles.panel} space-y-5`} aria-label="Details">
            <h2 className={styles.panelTitle}>Details</h2>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="video-title" className={styles.fieldLabel}>Title</label>
                <span className={styles.counter}>
                  {formData.title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
              <input
                id="video-title"
                type="text"
                maxLength={MAX_TITLE_LENGTH}
                value={formData.title}
                onChange={(event) => setFormData(prev => ({ ...prev, title: event.target.value }))}
                className={`${styles.input} ${errors.title ? 'border-red-500/60' : ''}`}
                placeholder="Video title"
              />
              {errors.title && <p className={styles.errorText}>{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className={styles.fieldLabel}>Description</label>
                <button type="button" onClick={() => setIsAIPanelOpen(true)} className={styles.inlineAction}>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Improve
                </button>
              </div>
              <div className={styles.editorFrame}>
                <RichTextEditor
                  content={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Describe the video..."
                  minHeight="220px"
                />
              </div>
              <div className="flex justify-between">
                <span className={styles.counter}>
                  {descriptionText.length.toLocaleString()} characters
                </span>
                {generatedDescription && <span className={styles.counter}>AI draft applied</span>}
              </div>
              {errors.description && <p className={styles.errorText}>{errors.description}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="video-tags" className={styles.fieldLabel}>Tags</label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-gray-800/60 bg-white/5 px-3
                              transition-colors hover:border-gray-700 focus-within:border-[#fa7517]/40">
                <Tag className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-hidden="true" />
                <input
                  id="video-tags"
                  type="text"
                  value={formData.tags}
                  onChange={(event) => setFormData(prev => ({ ...prev, tags: event.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                  placeholder="gaming, tutorial, launch"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={styles.fieldLabel}>Visibility</label>
              <div className="flex items-center justify-between gap-3 rounded-md border border-gray-800/60
                              bg-white/5 px-3 py-2">
                <p className="text-xs text-gray-500">
                  {canPublish
                    ? 'Public videos appear on your channel and in search.'
                    : 'A video can go public once it has finished processing.'}
                </p>
                <VisibilitySwitch
                  isPublic={formData.is_public}
                  canPublish={canPublish}
                  busy={isSubmitting}
                  title={formData.title || 'This video'}
                  onToggle={(next) => setFormData(prev => ({ ...prev, is_public: next }))}
                />
              </div>
            </div>

            {errors.submit && <p className={styles.errorText}>{errors.submit}</p>}
          </section>

          {/* ── Preview ─────────────────────────────────────────────────── */}
          <aside className="space-y-5" aria-label="Preview">
            <section className={styles.panel}>
              <h2 className={`${styles.panelTitle} mb-3`}>Preview</h2>

              <div className={styles.frame}>
                {isPreviewPlaying && previewVideoUrl ? (
                  <video
                    // No `autoPlay`: nothing plays until the creator asks. The
                    // play() below is their click, carried through the swap,
                    // so the affordance is one press rather than two.
                    ref={(element) => {
                      const started = element?.play();
                      if (started && typeof started.catch === 'function') {
                        started.catch(() => undefined);
                      }
                    }}
                    src={previewVideoUrl}
                    poster={thumbnailPreview || undefined}
                    controls
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPreviewPlaying(true)}
                    disabled={!previewVideoUrl}
                    aria-label={previewVideoUrl ? 'Play video' : 'Preview unavailable'}
                    className="group relative h-full w-full disabled:cursor-not-allowed"
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-black">
                        <ImageIcon className="h-6 w-6 text-gray-700" aria-hidden="true" />
                      </span>
                    )}
                    {previewVideoUrl && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30
                                       transition-colors group-hover:bg-black/45">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full
                                         bg-black/70 ring-1 ring-white/20 transition-transform
                                         group-hover:scale-105">
                          <Play className="ml-0.5 h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </span>
                    )}
                  </button>
                )}

                {isLoadingDetails && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#fa7517]" aria-hidden="true" />
                  </div>
                )}
              </div>

              {meta.length > 0 && (
                <p className={styles.metaRow}>
                  {meta.map((item, index) => (
                    <React.Fragment key={item}>
                      {index > 0 && <span aria-hidden="true">·</span>}
                      <span className="tabular-nums">{item}</span>
                    </React.Fragment>
                  ))}
                </p>
              )}

              {/* The edit endpoint parses a thumbnail and nothing else, so the
                  page does not pretend it can take a new source file. */}
              <p className={styles.hint}>
                To replace the file,{' '}
                <Link to="/creator-hub/content-studio" className={styles.hintLink}>
                  upload a new video from Content Studio
                </Link>
                .
              </p>

              {detailsError && (
                <div className={`${styles.errorNote} mt-3`}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {detailsError}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <h2 className={`${styles.panelTitle} mb-3`}>Artwork</h2>

              <div className={styles.thumbnailFrame}>
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Video thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-gray-700" aria-hidden="true" />
                  </div>
                )}
              </div>

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={styles.secondaryButton}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setIsAIThumbnailPanelOpen(true)}
                  className={styles.secondaryButton}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate
                </button>
              </div>
              {errors.thumbnail && <p className={`${styles.errorText} mt-2`}>{errors.thumbnail}</p>}
            </section>

            {onDelete && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800/60
                              px-4 py-2.5">
                <p className="text-xs text-gray-600">This cannot be undone.</p>
                <button
                  type="button"
                  onClick={() => onDelete(video.id)}
                  className={styles.dangerGhost}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete video…
                </button>
              </div>
            )}
          </aside>
        </div>

        <UnsavedChangesDialog
          isOpen={isLeaveDialogOpen}
          onCancel={() => setIsLeaveDialogOpen(false)}
          onConfirm={() => {
            setIsLeaveDialogOpen(false);
            onClose();
          }}
        />

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
      </form>
    </Tooltip.Provider>
  );
};

export default EditVideoModal;
