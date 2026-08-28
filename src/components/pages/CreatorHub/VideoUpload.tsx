// src/components/pages/CreatorHub/VideoUpload.tsx

/**
 * Upload one video.
 *
 * There is no wizard here any more. The transfer starts the moment a file is
 * chosen and keeps going in the background, so the page is a single screen: a
 * drop zone that turns into one file row, and a form underneath it. `Save`
 * settles the debounced metadata and hands the creator to Videos Management,
 * which is where an upload's life actually plays out.
 */

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileVideo, Globe2, Lock, Sparkles, UploadCloud, X } from 'lucide-react';
import { generateVideoDescription } from '../../../api/video';
import {
  editorHtmlToPlainText,
  hasEditorContent,
  plainTextToEditorHtml,
} from '../../../utils/descriptionText';
import { useUploadQueueContext } from '../../../contexts/UploadQueueContext';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import { showErrorToast } from '../../common/Notifications/ErrorToast';
import AIAssistantPanel from '../../common/AIAssistantPanel';
import AIThumbnailPanel from '../../common/AIThumbnailPanel';
import RichTextEditor from '../../common/RichTextEditor';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';
import { useAIthumbnail } from '../../../hooks/useAIthumbnail';
import { formatBytes, phaseDetail, phaseLabel, uploadPhase } from '../../upload/uploadPhase';
import type { UploadQueueViewEntry } from '../../../hooks/useUploadQueue';

const ACCEPTED = '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo';

/** The one-line format note — the whole of the old Upload Requirements card. */
const FORMAT_NOTE = 'MP4, MOV or AVI · up to 2 GB';

const FIELD =
  'w-full rounded-md border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white ' +
  'placeholder:text-gray-600 transition-colors focus:border-[#fa7517]/60 focus:outline-none ' +
  'focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';

const LABEL = 'block text-xs font-medium text-gray-400';

const SECONDARY =
  'inline-flex items-center gap-1.5 rounded text-xs text-[#fa7517] transition-colors ' +
  'hover:text-[#ff8c3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';

/** One row, one sentence — the same vocabulary Content Studio uses. */
export function phaseText(entry: UploadQueueViewEntry): string {
  const phase = uploadPhase(entry);
  const label = phaseLabel(entry);
  if (phase === 'ready') return label;
  if (phase === 'uploading') {
    return entry.status === 'uploading' ? `${label} ${entry.progress}%` : label;
  }
  return `${label} · ${phaseDetail(entry)}`;
}

const VideoUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [showAIThumbnailPanel, setShowAIThumbnailPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [generatedKeywords, setGeneratedKeywords] = useState<string[] | undefined>();
  const [generatedHashtags, setGeneratedHashtags] = useState<string[] | undefined>();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const uploadQueue = useUploadQueueContext();
  const [queueLocalId, setQueueLocalId] = useState<string | null>(null);
  const entry = queueLocalId
    ? (uploadQueue.entries.find((item) => item.localId === queueLocalId) ?? null)
    : null;
  // Stable across renders (useCallback in the hook), so they are safe in deps.
  const updateQueueMetadata = uploadQueue.updateMetadata;
  const parkThumbnail = uploadQueue.setPendingThumbnail;

  const { selectedChannelId, selectedChannel } = useChannelSelection();
  const navigate = useNavigate();

  const {
    generateForVideo,
    isGeneratingForVideo,
    generateFromPrompt,
    isGeneratingFromPrompt,
    generateWithReference,
    isGeneratingWithReference,
    refineThumbnail,
    isRefiningThumbnail,
  } = useAIthumbnail();

  /**
   * The transfer starts the moment a file is chosen — the form is filled in
   * while the bytes are already moving, which is the whole point of the
   * direct-to-storage queue.
   */
  const acceptFile = async (file: File) => {
    setFileError(null);
    if (!selectedChannelId) {
      setFileError('Select a channel before choosing a file.');
      return;
    }

    const result = await uploadQueue.enqueueFiles([file], Number(selectedChannelId));
    const created = result.accepted[0];
    if (!created) {
      // The SDK owns these strings, so the page never invents its own.
      setFileError(result.rejected[0]?.message ?? 'This file cannot be uploaded.');
      return;
    }
    setQueueLocalId(created.localId);
    setTitle(created.title);
    setTitleError(null);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void acceptFile(file);
    event.target.value = '';
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  };

  /**
   * Cancelling gives the page back its drop zone, not a dead row — but only
   * when the upload actually stopped. A cancel the server refused leaves the
   * row where it is, saying so, until the creator dismisses it: silently
   * clearing the page while bytes may still be moving is the lie this avoids.
   */
  const onCancel = async () => {
    if (!queueLocalId) return;
    const localId = queueLocalId;
    const stopped = await uploadQueue.abortEntry(localId);
    if (!stopped) return;
    setQueueLocalId(null);
    await uploadQueue.removeEntry(localId);
  };

  /** The creator dismissing a settled row: the queue forgets it either way. */
  const onRemove = async () => {
    if (!queueLocalId) return;
    const localId = queueLocalId;
    setQueueLocalId(null);
    await uploadQueue.removeEntry(localId);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showErrorToast('Choose a JPG or PNG image.');
      return;
    }

    // The Video row usually does not exist yet, so the queue holds the file and
    // applies it the moment `videoId` appears — even if the creator has
    // navigated away by then (the queue lives above the router).
    if (queueLocalId) parkThumbnail(queueLocalId, file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') setThumbnailPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyAIThumbnail = (thumbnailUrl: string) => {
    setThumbnailPreview(thumbnailUrl);
    fetch(thumbnailUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'ai-thumbnail.jpg', { type: 'image/jpeg' });
        if (queueLocalId) parkThumbnail(queueLocalId, file);
      })
      .catch(() => showErrorToast('Failed to apply AI thumbnail'));
  };

  /**
   * The generator is told what the page already knows.
   *
   * Title, the draft the creator has written so far, their tags, and who is
   * publishing (the selected channel's name and description) — a description
   * written without those is a description about nothing in particular.
   * `durationSeconds` is deliberately absent: the upload queue does not carry a
   * duration, so nothing here would be true.
   */
  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setTitleError('Give the video a title first.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateVideoDescription({
        title,
        keywords,
        additionalInfo,
        existingDescription: editorHtmlToPlainText(description),
        tags,
        channelName: selectedChannel?.name,
        channelDescription: editorHtmlToPlainText(selectedChannel?.description),
        language: typeof navigator === 'undefined' ? undefined : navigator.language,
      });
      setGeneratedDescription(result.description);
      setSuggestedTitle(result.suggestedTitle);
      setGeneratedKeywords(result.keywords);
      setGeneratedHashtags(result.hashtags);
    } catch {
      showErrorToast('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * The AI text lands in the editor as one paragraph per line, so the blank
   * lines between sections and the `\u2022` bullets are still there when the
   * draft PATCH (or the video PUT, once the row exists) sends the HTML on.
   */
  const handleAcceptDescription = (generated: string) => {
    setDescription(plainTextToEditorHtml(generated));
    setIsAIPanelOpen(false);
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

  /**
   * The bytes are already on their way — and stay on their way after this
   * component unmounts — so Save only settles the draft metadata still sitting
   * in the debounce and hands over to Videos Management.
   */
  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Give the video a title.');
      return;
    }
    if (queueLocalId) await uploadQueue.flushMetadata(queueLocalId);
    const highlight = entry?.videoId ?? entry?.uploadId ?? queueLocalId;
    navigate(
      highlight === null || highlight === undefined
        ? '/creator-hub/videos'
        : `/creator-hub/videos?highlight=${encodeURIComponent(String(highlight))}`,
    );
  };

  const phase = entry ? uploadPhase(entry) : null;
  const transferring = phase === 'uploading';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 pb-16 pt-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Upload a video</h1>
        <p className="mt-1 text-sm text-gray-500">
          The file uploads in the background while you fill in the details.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onFileChange}
      />

      {entry ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-800/60 bg-[#0f0f0f]">
          <div className="relative flex h-14 items-center gap-3 px-4">
            <FileVideo className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="truncate text-sm text-gray-100" title={entry.filename}>
                {entry.filename}
              </span>
              <span className="shrink-0 text-xs text-gray-600">{formatBytes(entry.sizeBytes)}</span>
            </div>

            {transferring && (
              <button
                type="button"
                onClick={() => void onCancel()}
                aria-label={`Cancel ${entry.filename}`}
                className="rounded px-1 text-xs text-gray-500 transition-colors hover:text-white
                           focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {/* A settled failure — including a cancel the server refused —
                stays on screen with its sentence until this is clicked. */}
            {phase === 'failed' && (
              <button
                type="button"
                onClick={() => void onRemove()}
                aria-label={`Remove ${entry.filename}`}
                className="shrink-0 rounded px-1 text-xs text-gray-500 transition-colors hover:text-white
                           focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
              >
                Remove
              </button>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={phaseText(entry)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`max-w-[16rem] shrink-0 truncate text-xs ${
                  phase === 'ready'
                    ? 'text-green-500'
                    : phase === 'failed'
                      ? 'text-red-400'
                      : phase === 'uploading'
                        ? 'text-[#fa7517]'
                        : 'text-gray-500'
                }`}
                title={phaseText(entry)}
              >
                {phaseText(entry)}
              </motion.span>
            </AnimatePresence>

            {/* Progress is a hairline at the foot of the row, not a chart. */}
            {transferring && (
              <div
                className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5"
                role="progressbar"
                aria-label={`Uploading ${entry.filename}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={entry.progress}
              >
                <div
                  className="h-full bg-[#fa7517] transition-[width] duration-300 ease-out"
                  style={{ width: `${entry.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          className={`mt-6 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-150 ${
            dragActive
              ? 'border-[#fa7517] bg-[#fa7517]/[0.06]'
              : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-gray-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-gray-200">Drop a video here</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 rounded text-sm text-[#fa7517] underline-offset-4 transition-colors
                       hover:text-[#ff8c3a] hover:underline focus-visible:outline-none
                       focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
          >
            or browse
          </button>
          <p className="mt-4 text-xs text-gray-600">{FORMAT_NOTE}</p>
        </div>
      )}

      {fileError && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-400" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fileError}
        </p>
      )}

      <div className="mt-8 space-y-6 rounded-lg border border-gray-800/60 bg-[#0f0f0f] p-5">
        <div>
          <span className={LABEL}>Channel</span>
          <div className="mt-2">
            <ChannelSelector />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="video-title">
            Title
          </label>
          <input
            id="video-title"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (event.target.value.trim()) setTitleError(null);
            }}
            placeholder="Video title"
            aria-invalid={titleError ? true : undefined}
            className={`mt-2 ${FIELD} ${titleError ? 'border-red-500/70' : ''}`}
          />
          {titleError && (
            <p className="mt-1.5 text-xs text-red-400" role="alert">
              {titleError}
            </p>
          )}
          {suggestedTitle && (
            <button
              type="button"
              onClick={() => {
                setTitle(suggestedTitle);
                setSuggestedTitle(undefined);
                setTitleError(null);
              }}
              className={`mt-1.5 ${SECONDARY}`}
            >
              Use suggested title: {suggestedTitle}
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Description</span>
            <button type="button" onClick={() => setIsAIPanelOpen(true)} className={SECONDARY}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Write with AI
            </button>
          </div>
          <div className="mt-2">
            <RichTextEditor
              content={description}
              onChange={setDescription}
              className="w-full rounded-md border border-gray-800 bg-black/40 text-sm text-white"
              placeholder="What is this video about?"
              minHeight="160px"
            />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="video-tags">
            Tags
          </label>
          <input
            id="video-tags"
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Separate tags with commas"
            className={`mt-2 ${FIELD}`}
          />
        </div>

        <div>
          <span className={LABEL}>Visibility</span>
          <div
            role="radiogroup"
            aria-label="Visibility"
            className="mt-2 inline-flex rounded-md border border-gray-800 p-0.5"
          >
            {[
              { id: 'public' as const, label: 'Public', Icon: Globe2 },
              { id: 'private' as const, label: 'Private', Icon: Lock },
            ].map(({ id, label, Icon }) => {
              const selected = visibility === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setVisibility(id)}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors duration-150 ${
                    selected ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Thumbnail</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className={SECONDARY}
              >
                {thumbnailPreview ? 'Replace image' : 'Choose image'}
              </button>
              <button
                type="button"
                onClick={() => setShowAIThumbnailPanel(true)}
                className={SECONDARY}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Generate with AI
              </button>
            </div>
          </div>
          {thumbnailPreview ? (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={thumbnailPreview}
                alt="Video thumbnail"
                className="h-16 w-28 rounded border border-gray-800 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setThumbnailPreview(null);
                  if (queueLocalId) parkThumbnail(queueLocalId, null);
                }}
                className="rounded text-xs text-gray-500 transition-colors hover:text-white
                           focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-600">Optional · JPG or PNG, 16:9</p>
          )}
          <input
            ref={thumbnailInputRef}
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailChange}
          />
        </div>
      </div>

      {entry && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="inline-flex items-center rounded-md bg-[#fa7517] px-3.5 py-2 text-sm font-medium
                       text-black transition-colors hover:bg-[#ff8c3a] focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
          >
            {transferring ? 'Save & continue uploading' : 'Save'}
          </button>
          <p className="text-xs text-gray-600">
            {transferring
              ? 'The upload keeps going after you leave this page.'
              : 'Track this video in Videos Management.'}
          </p>
        </div>
      )}

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
        generatedKeywords={generatedKeywords}
        hashtags={generatedHashtags}
        onAcceptTitle={() => {
          setTitle(suggestedTitle || '');
          setSuggestedTitle(undefined);
          setTitleError(null);
        }}
        onAcceptDescription={handleAcceptDescription}
        hasExistingDescription={hasEditorContent(description)}
        mode="video"
      />

      <AIThumbnailPanel
        isOpen={showAIThumbnailPanel}
        onClose={() => setShowAIThumbnailPanel(false)}
        videoId={entry?.videoId ?? undefined}
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
    </div>
  );
};

export default VideoUpload;
