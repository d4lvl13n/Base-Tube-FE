import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import { hasPendingEdits, validateDraftFields, type PublishBlocker } from '@basetube/api';
import type { DraftWorkspaceApi, WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { useUploadQueueContext, useUploadSession } from '../../../contexts/UploadQueueContext';
import { useAIthumbnail } from '../../../hooks/useAIthumbnail';
import { generateVideoDescription } from '../../../api/video';
import { editorHtmlToPlainText, hasEditorContent, plainTextToEditorHtml } from '../../../utils/descriptionText';
import type { Channel } from '../../../types/channel';
import AIAssistantPanel from '../../common/AIAssistantPanel';
import AIThumbnailPanel from '../../common/AIThumbnailPanel';
import RichTextEditor from '../../common/RichTextEditor';
import MediaCard from './MediaCard';
import ThumbnailPicker from './ThumbnailPicker';
import type { WorkspaceLayout } from './useWorkspaceLayout';
import { displayTitle, editorialLabel, isPublished, type TechnicalState } from './draftStatus';
import { fieldProblemCopy, localBlockerCopy, serverBlockerCopy, workspaceCopy } from './workspaceCopy';

type PreviewMode = 'video' | 'presentation';

const FIELD =
  'w-full rounded-md border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white ' +
  'placeholder:text-gray-600 transition-colors focus:border-[#fa7517]/60 focus:outline-none ' +
  'focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';
const LABEL = 'block text-xs font-medium text-gray-400';
const LINK_BUTTON =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded text-xs text-[#fa7517] transition-colors ' +
  'hover:text-[#ff8c3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';
const QUIET_BUTTON =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm text-gray-300 transition-colors ' +
  'hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600';
/** The AI tools are offered as real buttons, in view, never as a small link. */
const AI_BUTTON =
  'inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#fa7517]/40 bg-[#fa7517]/[0.08] px-3 text-sm ' +
  'font-medium text-[#fa7517] transition-colors hover:border-[#fa7517]/70 hover:bg-[#fa7517]/[0.14] ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';
const PRIMARY_BUTTON =
  'inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#fa7517] px-4 text-sm font-medium text-black ' +
  'transition-colors hover:bg-[#ff8c3a] disabled:cursor-not-allowed disabled:bg-[#fa7517]/30 disabled:text-black/60 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60';

function tagsToText(tags: string[] | null): string {
  return (tags ?? []).join(', ');
}

function textToTags(text: string): string[] | null {
  const tags = text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : null;
}

function blockerSentences(blockers: readonly PublishBlocker[]): Array<{ text: string; reference: string | null }> {
  const sentences: Array<{ text: string; reference: string | null }> = [];
  const seen = new Set<string>();
  for (const blocker of blockers) {
    // Documented server codes have their sentence; an unknown one gets a
    // generic sentence with the code only as a support reference.
    const server = blocker.source === 'server' ? serverBlockerCopy(blocker.code) : null;
    const text = blocker.source === 'local' ? localBlockerCopy(blocker.code) : server!.text;
    const reference = server && !server.known ? blocker.code : null;
    const identity = `${text}|${reference ?? ''}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    sentences.push({ text, reference });
  }
  return sentences;
}

interface DraftEditorProps {
  draft: WorkspaceDraft;
  workspace: DraftWorkspaceApi;
  technical: TechnicalState;
  channel: Channel | undefined;
  layout: WorkspaceLayout;
  /** Previous / next video of the grid; null at either end. */
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

/**
 * One video's editor: preview, title, description, thumbnail, and the
 * explicit publication (UP-UX §5.2, §7, §8, §12).
 *
 * Rendered with `key={draft.key}`: switching videos mounts a fresh editor, so
 * a panel, an AI suggestion or a confirmation opened for one video can never
 * act on the next one.
 */
const DraftEditor: React.FC<DraftEditorProps> = ({
  draft,
  workspace,
  technical,
  channel,
  layout,
  onPrevious,
  onNext,
  onClose,
  onAnnounce,
}) => {
  const { key, record, runtime, entry } = draft;
  const server = record.server;
  const queue = useUploadQueueContext();
  const session = useUploadSession();
  const published = isPublished(draft);
  const title = displayTitle(draft);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const tagsFocusedRef = useRef(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('video');
  const [tagsText, setTagsText] = useState(() => tagsToText(record.desired.tags));
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [thumbnailNotice, setThumbnailNotice] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // AI assistance — opened on demand, applied only after acceptance.
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isThumbnailPanelOpen, setIsThumbnailPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState<string | undefined>();
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [generatedKeywords, setGeneratedKeywords] = useState<string[] | undefined>();
  const [generatedHashtags, setGeneratedHashtags] = useState<string[] | undefined>();
  /** What the fields held when the suggestion was asked for, to detect edits made since. */
  const aiBaseRef = useRef<{ title: string; description: string | null } | null>(null);
  const [aiConflict, setAiConflict] = useState<{ field: 'title' | 'description'; value: string } | null>(null);
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

  // Tags are typed as text; keep the text in step with server reloads when
  // the field is not being typed in.
  const desiredTags = record.desired.tags;
  useEffect(() => {
    if (!tagsFocusedRef.current) setTagsText(tagsToText(desiredTags));
  }, [desiredTags]);

  // Significant changes are announced; the moving percentage is not.
  const lastAnnounced = useRef<string | null>(null);
  useEffect(() => {
    if (lastAnnounced.current === technical.key) return;
    const first = lastAnnounced.current === null;
    lastAnnounced.current = technical.key;
    if (!first) onAnnounce(`${title}: ${technical.percent !== null ? 'Sending video' : technical.label}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technical.key]);
  useEffect(() => {
    if (runtime.save === 'failed' || runtime.save === 'conflict') {
      onAnnounce(`${title}: ${runtime.save === 'conflict' ? workspaceCopy.conflictTitle : workspaceCopy.notSaved}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime.save]);
  useEffect(() => {
    if (runtime.publishedJustNow) onAnnounce(`${title}: ${workspaceCopy.publishedTitle}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime.publishedJustNow]);

  const problems = validateDraftFields(record.desired);
  const titleProblems = problems.filter((problem) => problem.startsWith('TITLE'));
  const otherProblems = problems.filter((problem) => !problem.startsWith('TITLE'));
  const readiness = workspace.readiness(key);
  const blockers = useMemo(() => blockerSentences(readiness.blockers), [readiness.blockers]);
  // Only an autosave still in its debounce stands between the creator and a
  // publish attempt: the command flushes it first, so it does not disable the button.
  const onlySavePending = readiness.blockers.every(
    (blocker) => blocker.source === 'local' && blocker.code === 'SAVE_PENDING',
  );
  const serverAllows = !!server && server.canPublish && server.playbackReady && !published;
  const publishBusy = runtime.publish === 'publishing' || runtime.publish === 'verifying' || !!record.publication;
  const canPublish = serverAllows && (readiness.ready || onlySavePending) && !publishBusy;
  const videoUrl = server?.videoId ? `${window.location.origin}/video/${server.videoId}` : null;

  // ── technical actions ────────────────────────────────────────────────────
  const runAction = async () => {
    setActionMessage(null);
    switch (technical.action) {
      case 'cancel':
        if (entry) await queue.abortEntry(entry.localId);
        break;
      case 'sign_in':
        await session.requestSignIn();
        break;
      case 'choose_file':
      case 'send_again':
        fileInputRef.current?.click();
        break;
      case 'retry_now':
        if (entry) await queue.retryEntry(entry.localId);
        break;
      case 'verify_cancel':
        if (entry) await queue.verifyEntry(entry.localId);
        break;
      case 'retry_processing':
        setActionMessage(await workspace.retryProcessing(key));
        break;
      case 'retry_create':
        workspace.retryCreate(key);
        break;
      default:
        break;
    }
  };

  const actionLabel: Record<TechnicalState['action'], string | null> = {
    none: null,
    cancel: workspaceCopy.cancel,
    sign_in: workspaceCopy.signInAgain,
    choose_file: workspaceCopy.chooseFile,
    retry_now: workspaceCopy.retryNow,
    send_again: workspaceCopy.sendAgain,
    verify_cancel: workspaceCopy.verifyCancel,
    retry_processing: workspaceCopy.retryPreparation,
    retry_create: workspaceCopy.retry,
  };

  // The single action of the video card. Anything the creator must do is the
  // primary button; a cancel or a retry the queue would do anyway stays quiet.
  const actionText = actionLabel[technical.action];
  const mediaAction =
    actionText === null
      ? null
      : {
          label: actionText,
          primary: technical.tone === 'attention' && technical.action !== 'cancel',
          onClick: () => void runAction(),
        };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setFileMessage(null);
        void workspace.attachFile(key, file).then(setFileMessage);
      }}
    />
  );

  // ── save status line ─────────────────────────────────────────────────────
  let saveLine: React.ReactNode;
  if (!record.draftId) {
    saveLine = <span className="text-gray-500">{workspaceCopy.creating}</span>;
  } else {
    switch (runtime.save) {
      case 'saving':
      case 'scheduled':
        saveLine = (
          <span className="inline-flex items-center gap-1 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {workspaceCopy.saving}
          </span>
        );
        break;
      case 'failed':
        saveLine = (
          <span className="inline-flex flex-wrap items-center gap-x-2 text-yellow-400">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {workspaceCopy.notSaved}
            {runtime.saveError ? ` — ${runtime.saveError}` : ''}
            <button type="button" onClick={() => workspace.retrySave(key)} className={LINK_BUTTON}>
              {workspaceCopy.retry}
            </button>
          </span>
        );
        break;
      case 'offline':
        saveLine = (
          <span className="text-yellow-400">
            {workspace.durable && !runtime.persistFailed ? workspaceCopy.offlineKept : workspaceCopy.offlineAtRisk}
          </span>
        );
        break;
      case 'auth_required':
        saveLine = (
          <span className="inline-flex flex-wrap items-center gap-x-2 text-yellow-400">
            {workspace.durable && !runtime.persistFailed ? workspaceCopy.saveSignIn : workspaceCopy.sessionExpired}
            <button type="button" onClick={() => void session.requestSignIn()} className={LINK_BUTTON}>
              {workspaceCopy.signInAgain}
            </button>
          </span>
        );
        break;
      case 'conflict':
        saveLine = <span className="text-yellow-400">{workspaceCopy.conflictTitle}</span>;
        break;
      case 'invalid':
        saveLine = <span className="text-yellow-400">{workspaceCopy.invalid}</span>;
        break;
      default:
        saveLine = hasPendingEdits(record.pending) ? (
          <span className="text-gray-400">{workspaceCopy.saving}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-gray-400">
            <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
            {workspaceCopy.saved}
          </span>
        );
    }
  }

  // ── AI ───────────────────────────────────────────────────────────────────
  const openAiAssistant = () => {
    aiBaseRef.current = { title: record.desired.title, description: record.desired.description };
    setIsAiPanelOpen(true);
  };

  const handleGenerateDescription = async () => {
    aiBaseRef.current = { title: record.desired.title, description: record.desired.description };
    setIsGenerating(true);
    try {
      const result = await generateVideoDescription({
        title: record.desired.title,
        keywords,
        additionalInfo,
        existingDescription: editorHtmlToPlainText(record.desired.description ?? ''),
        tags: tagsText,
        channelName: channel?.name,
        channelDescription: editorHtmlToPlainText(channel?.description),
        language: typeof navigator === 'undefined' ? undefined : navigator.language,
      });
      setGeneratedDescription(result.description);
      setSuggestedTitle(result.suggestedTitle);
      setGeneratedKeywords(result.keywords);
      setGeneratedHashtags(result.hashtags);
    } catch {
      setActionMessage('The writing assistant is unavailable right now. You can still write and publish manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  /** Applies a suggestion, unless the creator edited that field since asking: then ask first. */
  const acceptSuggestion = (field: 'title' | 'description', value: string) => {
    const base = aiBaseRef.current;
    const current = field === 'title' ? record.desired.title : record.desired.description;
    const baseValue = base ? (field === 'title' ? base.title : base.description) : current;
    if ((current ?? '') !== (baseValue ?? '')) {
      setAiConflict({ field, value });
      return;
    }
    workspace.edit(key, field === 'title' ? { title: value } : { description: value });
    workspace.commit(key);
    if (field === 'title') setSuggestedTitle(undefined);
  };

  const handleAiThumbnail = (thumbnailUrl: string) => {
    void fetch(thumbnailUrl)
      .then((response) => response.blob())
      .then((blob) => workspace.chooseThumbnailFile(key, blob, 'ai-thumbnail.jpg', 'ai'))
      .then((result) => setThumbnailNotice(result.message))
      .catch(() => setThumbnailNotice('The AI thumbnail could not be applied. Try again or upload an image.'));
  };

  // ── publication ──────────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!videoUrl) return;
    try {
      await navigator.clipboard.writeText(videoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2_000);
    } catch {
      setActionMessage(videoUrl);
    }
  };

  const conflict = runtime.conflict;

  // ── server preview (owner-only, five-minute URLs) ───────────────────────
  const serverPreview = workspace.preview(key);
  const loadPreview = workspace.loadPreview;
  const wantsPreview = !!record.draftId && (!!server?.playbackReady || !!server?.thumbnail.ready);
  const previewSignature = `${server?.playbackReady}|${server?.thumbnail.assetId}|${server?.thumbnail.ready}`;
  useEffect(() => {
    if (wantsPreview) void loadPreview(key);
  }, [key, loadPreview, previewSignature, wantsPreview]);
  // Reload 30 s before the earliest URL expires, so the player never holds a dead link.
  const earliestExpiry = [serverPreview?.playback?.expiresAt, serverPreview?.thumbnail?.expiresAt]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => new Date(value).getTime())
    .sort((a, b) => a - b)[0];
  useEffect(() => {
    if (!earliestExpiry || !wantsPreview) return;
    const timer = setTimeout(() => void loadPreview(key), Math.max(5_000, earliestExpiry - Date.now() - 30_000));
    return () => clearTimeout(timer);
  }, [earliestExpiry, key, loadPreview, wantsPreview]);
  // A local choice wins on screen; otherwise the server's selected thumbnail.
  const thumbnailUrl =
    workspace.thumbnailPreviewUrl(key) ??
    (record.thumbnail?.kind === 'automatic' && record.thumbnail.status !== 'selected'
      ? null
      : (serverPreview?.thumbnail?.url ?? null));

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label={title} role="region">
      {/* The inspector head names the video and the file it came from (AA `ig-inspector-head`). */}
      <header className="flex items-start justify-between gap-3 border-b border-gray-800 px-5 py-4">
        <div className="min-w-0">
          <strong className="block break-words text-[15px] font-semibold text-white">{title}</strong>
          <small className="mt-1 block break-all text-xs text-gray-500">
            {[entry?.filename ?? record.filename, channel?.name].filter(Boolean).join(' · ')}
          </small>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={workspaceCopy.closeInspector}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-800 text-gray-400
                     transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">

      {published && !runtime.publishedJustNow && (
        <p className="mt-3 rounded-md border border-gray-800/60 bg-white/[0.03] px-3 py-2 text-xs text-gray-300">
          {workspaceCopy.publishedEditing}
        </p>
      )}

      {runtime.publishedJustNow && server?.videoId && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-green-500/30 bg-green-500/[0.06] px-3 py-2" role="status">
          <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
          <span className="text-sm text-green-300">{workspaceCopy.publishedTitle}</span>
          <Link to={`/video/${server.videoId}`} className={LINK_BUTTON}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {workspaceCopy.viewVideo}
          </Link>
          <button type="button" onClick={() => void copyLink()} className={LINK_BUTTON}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            {linkCopied ? workspaceCopy.linkCopied : workspaceCopy.copyLink}
          </button>
        </div>
      )}

      {runtime.save === 'conflict' && (
        <section
          aria-label={workspaceCopy.conflictTitle}
          className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.05] p-4"
        >
          <h3 className="text-sm font-medium text-yellow-200">{workspaceCopy.conflictTitle}</h3>
          <p className="mt-1 text-xs text-gray-400">{conflict ? workspaceCopy.conflictBody : workspaceCopy.conflictUnknown}</p>
          {conflict && (
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              {(
                [
                  ['Title', record.desired.title, conflict.title],
                  [
                    'Description',
                    editorHtmlToPlainText(record.desired.description ?? ''),
                    editorHtmlToPlainText(conflict.description ?? ''),
                  ],
                  ['Tags', tagsToText(record.desired.tags), tagsToText(conflict.tags)],
                ] as const
              )
                .filter(([, mine, saved]) => mine !== saved)
                .map(([label, mine, saved]) => (
                  <React.Fragment key={label}>
                    <div>
                      <dt className="text-gray-500">
                        {label} — {workspaceCopy.conflictYours}
                      </dt>
                      <dd className="mt-1 line-clamp-4 whitespace-pre-line text-gray-200">{mine || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">
                        {label} — {workspaceCopy.conflictSaved}
                      </dt>
                      <dd className="mt-1 line-clamp-4 whitespace-pre-line text-gray-200">{saved || '—'}</dd>
                    </div>
                  </React.Fragment>
                ))}
            </dl>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void workspace.resolveConflict(key, 'reload')} className={QUIET_BUTTON}>
              {workspaceCopy.conflictReload}
            </button>
            {conflict && (
              <button
                type="button"
                onClick={() => void workspace.resolveConflict(key, 'keep')}
                className={`${QUIET_BUTTON} text-[#fa7517] hover:text-[#ff8c3a]`}
              >
                {workspaceCopy.conflictKeep}
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mt-4 space-y-6">
        {/* No video preview in the panel: the tile already shows the video.
            Only when the file needs the creator does one line say so here,
            with its action. */}
        {(mediaAction || technical.tone === 'attention' || fileMessage || actionMessage) && (
          <div
            className={`rounded-md border px-3 py-2.5 ${
              technical.tone === 'attention' ? 'border-yellow-500/25 bg-yellow-500/[0.05]' : 'border-white/10 bg-white/[0.03]'
            }`}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className={`min-w-0 flex-1 text-sm ${technical.tone === 'attention' ? 'text-yellow-100' : 'text-gray-200'}`}>
                {technical.tone === 'attention' && (
                  <AlertCircle className="mr-1.5 inline h-4 w-4 align-[-3px] text-yellow-400" aria-hidden="true" />
                )}
                {technical.label}
              </p>
              {mediaAction && (
                <button
                  type="button"
                  onClick={mediaAction.onClick}
                  className={mediaAction.primary ? PRIMARY_BUTTON : QUIET_BUTTON}
                >
                  {mediaAction.label}
                </button>
              )}
              {technical.action === 'verify_cancel' && entry && (
                <button type="button" onClick={() => void queue.abortEntry(entry.localId)} className={QUIET_BUTTON}>
                  {workspaceCopy.cancel}
                </button>
              )}
            </div>
            {technical.detail && <p className="mt-1 text-xs text-gray-400">{technical.detail}</p>}
            {(fileMessage || actionMessage) && (
              <p className="mt-1 text-xs text-yellow-300" role="alert">
                {fileMessage ?? actionMessage}
              </p>
            )}
          </div>
        )}
        {fileInput}

        {/* "Preview" shows the title and thumbnail as a viewer meets them, on request. */}
        {previewMode === 'presentation' && (
          <div ref={previewRef} className="mx-auto w-full max-w-sm">
            <MediaCard
              draft={draft}
              technical={technical}
              presentation
              thumbnailUrl={thumbnailUrl}
              serverPlaybackUrl={null}
              channelName={channel?.name ?? null}
              channelImageUrl={channel?.channel_image_url ?? null}
              action={null}
              secondaryAction={null}
              message={null}
            />
          </div>
        )}

        <div className="min-w-0 space-y-6">
          <div>
            <label className={LABEL} htmlFor={`draft-title-${key}`}>
              {workspaceCopy.title}
            </label>
            <input
              id={`draft-title-${key}`}
              type="text"
              value={record.desired.title}
              onChange={(event) => workspace.edit(key, { title: event.target.value })}
              onBlur={() => workspace.commit(key)}
              aria-invalid={titleProblems.length > 0 ? true : undefined}
              aria-describedby={titleProblems.length > 0 ? `draft-title-problem-${key}` : undefined}
              className={`mt-1.5 w-full rounded-md border bg-transparent px-3 py-2.5 text-base font-semibold text-white
                          placeholder:text-gray-600 transition-colors focus:outline-none focus-visible:ring-1 ${
                            titleProblems.length > 0
                              ? 'border-red-500/70 focus-visible:ring-red-500/60'
                              : 'border-gray-800 hover:border-gray-700 focus:border-[#fa7517]/60 focus-visible:ring-[#fa7517]/60'
                          }`}
            />
            {titleProblems.length > 0 && (
              <p id={`draft-title-problem-${key}`} className="mt-1.5 text-xs text-red-400">
                {titleProblems.map(fieldProblemCopy).join(' ')}
              </p>
            )}
            {suggestedTitle && (
              <button type="button" onClick={() => acceptSuggestion('title', suggestedTitle)} className={`mt-1 ${LINK_BUTTON}`}>
                Use suggested title: {suggestedTitle}
              </button>
            )}
          </div>

          {/* Next to the title, so its AI tool is in view without scrolling. */}
          <ThumbnailPicker
            draft={draft}
            previewUrl={thumbnailUrl}
            onImport={(file) => {
              setThumbnailNotice(null);
              void workspace.chooseThumbnailFile(key, file, file.name, 'import').then((result) => setThumbnailNotice(result.message));
            }}
            onAutomatic={() => {
              setThumbnailNotice(null);
              workspace.chooseAutomaticThumbnail(key);
            }}
            onOpenAi={() => setIsThumbnailPanelOpen(true)}
            onRetry={() => workspace.retryThumbnail(key)}
            notice={thumbnailNotice}
            stacked={layout === 'compact'}
          />

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className={LABEL} id={`draft-description-label-${key}`}>
                {workspaceCopy.description}
              </span>
              <button type="button" onClick={openAiAssistant} className={AI_BUTTON}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {workspaceCopy.writeWithAi}
              </button>
            </div>
            {/* The shared editor has no blur callback: leaving its container is the blur. */}
            <div
              className="mt-2"
              aria-labelledby={`draft-description-label-${key}`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) workspace.commit(key);
              }}
            >
              <RichTextEditor
                content={record.desired.description ?? ''}
                onChange={(html) => workspace.edit(key, { description: hasEditorContent(html) ? html : null })}
                className="w-full rounded-md border border-gray-800 bg-black/40 text-sm text-white"
                placeholder="What is this video about?"
                minHeight="320px"
              />
            </div>
            {otherProblems.includes('DESCRIPTION_TOO_LONG') && (
              <p className="mt-1.5 text-xs text-red-400">{fieldProblemCopy('DESCRIPTION_TOO_LONG')}</p>
            )}
          </div>

          {aiConflict && (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/[0.05] p-3 text-xs" role="alertdialog" aria-label={workspaceCopy.aiOverwrite}>
              <p className="text-yellow-200">{workspaceCopy.aiOverwrite}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    workspace.edit(key, aiConflict.field === 'title' ? { title: aiConflict.value } : { description: aiConflict.value });
                    workspace.commit(key);
                    if (aiConflict.field === 'title') setSuggestedTitle(undefined);
                    setAiConflict(null);
                  }}
                  className={QUIET_BUTTON}
                >
                  {workspaceCopy.aiReplace}
                </button>
                <button type="button" onClick={() => setAiConflict(null)} className={QUIET_BUTTON}>
                  {workspaceCopy.aiKeepMine}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-800/60 pt-4">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={`draft-more-${key}`}
              onClick={() => setMoreOpen((open) => !open)}
              className={`${QUIET_BUTTON} -ml-3`}
            >
              {moreOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
              {workspaceCopy.moreOptions}
            </button>
            {moreOpen && (
              <div id={`draft-more-${key}`} className="mt-3 space-y-5">
                <div>
                  <label className={LABEL} htmlFor={`draft-tags-${key}`}>
                    {workspaceCopy.tags}
                  </label>
                  <input
                    id={`draft-tags-${key}`}
                    type="text"
                    value={tagsText}
                    onFocus={() => {
                      tagsFocusedRef.current = true;
                    }}
                    onChange={(event) => {
                      setTagsText(event.target.value);
                      workspace.edit(key, { tags: textToTags(event.target.value) });
                    }}
                    onBlur={() => {
                      tagsFocusedRef.current = false;
                      workspace.commit(key);
                    }}
                    placeholder={workspaceCopy.tagsHint}
                    className={`mt-2 ${FIELD}`}
                  />
                  {otherProblems
                    .filter((problem) => problem === 'TOO_MANY_TAGS' || problem === 'TAG_TOO_LONG')
                    .map((problem) => (
                      <p key={problem} className="mt-1.5 text-xs text-red-400">
                        {fieldProblemCopy(problem)}
                      </p>
                    ))}
                </div>

                {published && (
                  <div>
                    {confirmUnpublish ? (
                      <div className="rounded-md border border-gray-800 p-3 text-xs" role="alertdialog" aria-label={workspaceCopy.unpublish}>
                        <p className="text-gray-300">{workspaceCopy.unpublishConfirm}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmUnpublish(false);
                              void workspace.unpublish(key);
                            }}
                            className={QUIET_BUTTON}
                          >
                            <Lock className="h-4 w-4" aria-hidden="true" />
                            {workspaceCopy.unpublishAction}
                          </button>
                          <button type="button" onClick={() => setConfirmUnpublish(false)} className={QUIET_BUTTON}>
                            {workspaceCopy.keep}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmUnpublish(true)} disabled={publishBusy} className={`${QUIET_BUTTON} -ml-3`}>
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        {workspaceCopy.unpublish}
                      </button>
                    )}
                  </div>
                )}

                <div>
                  {confirmDelete ? (
                    <div className="rounded-md border border-red-500/30 p-3 text-xs" role="alertdialog" aria-label={workspaceCopy.deleteDraft}>
                      <p className="text-gray-300">{workspaceCopy.deleteConfirm}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={runtime.deleting}
                          onClick={() => {
                            void workspace.deleteDraft(key).then((deleted) => {
                              if (deleted) onAnnounce(`${title}: deleted`);
                            });
                          }}
                          className={`${QUIET_BUTTON} text-red-400 hover:text-red-300`}
                        >
                          {runtime.deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                          {workspaceCopy.deleteAction}
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(false)} className={QUIET_BUTTON}>
                          {workspaceCopy.keep}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(true)} className={`${QUIET_BUTTON} -ml-3 text-red-400 hover:text-red-300`}>
                      {workspaceCopy.deleteDraft}
                    </button>
                  )}
                  {runtime.deleteError && (
                    <p className="mt-1.5 text-xs text-yellow-400" role="alert">
                      {runtime.deleteError}
                    </p>
                  )}
                </div>

                {published && (
                  <button type="button" onClick={() => workspace.dismiss(key)} className={`${QUIET_BUTTON} -ml-3`}>
                    {workspaceCopy.dismiss}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* The inspector foot: the save state and the editorial state once, why
          Publish is unavailable (never only a disabled button), Publish for
          THIS video, and previous / next (AA `ig-inspector-nav`). */}
      {/* Right padding keeps Publish clear of the site's floating help button. */}
      <footer className="border-t border-gray-800 bg-[#09090B] py-3 pl-5 pr-20" aria-label="Publication">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span aria-live="polite">{saveLine}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
              published ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400'
            }`}
          >
            {published ? <Check className="h-3 w-3" aria-hidden="true" /> : <Lock className="h-3 w-3" aria-hidden="true" />}
            {editorialLabel(draft)}
          </span>
        </div>
        {!published && !canPublish && !publishBusy && blockers.length > 0 && (
          <p id={`draft-blockers-${key}`} className="mt-1.5 text-xs text-gray-400">
            {workspaceCopy.notYet} {blockers.map((blocker) => blocker.text).join(' ')}
          </p>
        )}
        {runtime.publishError && (
          <p className="mt-1.5 text-xs text-yellow-400" role="alert">
            {runtime.publishError}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevious ?? undefined}
              disabled={!onPrevious}
              aria-label={workspaceCopy.previousVideo}
              className={`${QUIET_BUTTON} disabled:opacity-30`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNext ?? undefined}
              disabled={!onNext}
              aria-label={workspaceCopy.nextVideo}
              className={`${QUIET_BUTTON} disabled:opacity-30`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={previewMode === 'presentation'}
              onClick={() => {
                setPreviewMode((mode) => (mode === 'presentation' ? 'video' : 'presentation'));
                previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              className={QUIET_BUTTON}
            >
              {previewMode === 'presentation' ? workspaceCopy.backToEditing : workspaceCopy.preview}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1">
            {published ? (
              <>
                {server?.videoId && (
                  <Link to={`/video/${server.videoId}`} className={QUIET_BUTTON}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {workspaceCopy.viewVideo}
                  </Link>
                )}
                {videoUrl && (
                  <button type="button" onClick={() => void copyLink()} className={QUIET_BUTTON}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {linkCopied ? workspaceCopy.linkCopied : workspaceCopy.copyLink}
                  </button>
                )}
              </>
            ) : runtime.publish === 'verifying' || (record.publication && runtime.publish !== 'publishing') ? (
              <span className="inline-flex min-h-[44px] items-center gap-2 px-3 text-sm text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                {workspaceCopy.verifyingPublication}
                {runtime.publish !== 'verifying' && (
                  <button type="button" onClick={() => workspace.verifyPublication(key)} className={LINK_BUTTON}>
                    {workspaceCopy.checkAgain}
                  </button>
                )}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void workspace.publish(key)}
                disabled={!canPublish}
                aria-describedby={!canPublish && blockers.length > 0 ? `draft-blockers-${key}` : undefined}
                className={PRIMARY_BUTTON}
              >
                {runtime.publish === 'publishing' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {runtime.publish === 'publishing' ? workspaceCopy.publishing : workspaceCopy.publish}
              </button>
            )}
          </div>
        </div>
      </footer>

      <AIAssistantPanel
        isOpen={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        title={record.desired.title}
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
          if (suggestedTitle) acceptSuggestion('title', suggestedTitle);
        }}
        onAcceptDescription={(generated: string) => {
          acceptSuggestion('description', plainTextToEditorHtml(generated));
          setIsAiPanelOpen(false);
        }}
        hasExistingDescription={hasEditorContent(record.desired.description ?? '')}
        mode="video"
      />

      <AIThumbnailPanel
        isOpen={isThumbnailPanelOpen}
        onClose={() => setIsThumbnailPanelOpen(false)}
        // Generation from the video itself needs media the server can read.
        videoId={server?.playbackReady && server.videoId ? server.videoId : undefined}
        videoTitle={record.desired.title}
        videoDescription={record.desired.description ?? ''}
        onThumbnailGenerated={handleAiThumbnail}
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

export default DraftEditor;
