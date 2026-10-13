// src/components/upload/workspace/UploadWorkspace.tsx

/**
 * The single place to add and prepare videos (UP-UX).
 *
 * One screen for one or many videos: files start sending the moment they are
 * chosen, the editor is usable at once, and publishing is an explicit action
 * on the selected video. Nothing here asks "one video or several?" — a second
 * video simply adds the list beside the editor.
 *
 * Layout (UP-UX §5.4):
 *   ≥ 1200 px  list beside the editor (when there is more than one video),
 *              preview and fields side by side;
 *   768–1199   the list folds above the editor, preview and fields stack;
 *   < 768      the list and the editor are two views, with an explicit Back.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, ChevronDown, ChevronUp, Pause, Play, Plus, UploadCloud, X } from 'lucide-react';
import type { RejectedUploadFile } from '@basetube/api';
import { useDraftWorkspaceContext } from '../../../contexts/DraftWorkspaceContext';
import { useUploadQueueContext, useUploadSession } from '../../../contexts/UploadQueueContext';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';
import NoChannelView from '../../pages/CreatorHub/NoChannelView';
import { UploadRow } from '../../pages/CreatorHub/ContentStudio';
import { formatBytes } from '../uploadPhase';
import { describeUploadError } from '../uploadCopy';
import DraftEditor from './DraftEditor';
import DraftList from './DraftList';
import { technicalState, type StatusContext } from './draftStatus';
import { workspaceCopy } from './workspaceCopy';
import { useWorkspaceLayout } from './useWorkspaceLayout';

const ACCEPTED = '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo';

function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

const UploadWorkspace: React.FC = () => {
  const workspace = useDraftWorkspaceContext();
  const queue = useUploadQueueContext();
  const session = useUploadSession();
  const { channels, selectedChannelId, isLoading: channelsLoading } = useChannelSelection();
  const { draftId } = useParams<{ draftId?: string }>();
  const navigate = useNavigate();
  const online = useOnline();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const legacyReselectRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeDrag, setResumeDrag] = useState(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const [dragActive, setDragActive] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [selectionSummary, setSelectionSummary] = useState<{ added: number; rejected: RejectedUploadFile[] } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState('');
  const [missingDraft, setMissingDraft] = useState(false);

  const workspaceItems = workspace?.items;
  const items = useMemo(() => workspaceItems ?? [], [workspaceItems]);
  const selectedKey = workspace?.selectedKey ?? null;
  const selected = items.find((item) => item.key === selectedKey) ?? null;
  const multiple = items.length > 1;
  const layout = useWorkspaceLayout();
  // compact: the list only while no video is open; medium: a foldable list
  // above the open video; wide: a column beside it (UP-UX §5.4).
  const showList = !selected || (multiple && layout !== 'compact');
  const listFoldable = !!selected && multiple && layout === 'medium';
  const sideBySide = !!selected && multiple && layout === 'wide';
  const channelId = selectedChannelId ? Number(selectedChannelId) : 0;
  const channelById = useCallback(
    (id: number) => channels.find((channel) => Number(channel.id) === id),
    [channels],
  );

  const statusContext = useCallback(
    (draft: WorkspaceDraft): StatusContext => ({
      cancelling: !!draft.entry && queue.cancellingIds.has(draft.entry.localId),
      heldElsewhere: !!draft.entry && queue.heldElsewhereIds.has(draft.entry.localId),
      online,
    }),
    [online, queue.cancellingIds, queue.heldElsewhereIds],
  );

  // The server list is loaded when this page opens, not on every page of the app.
  const activate = workspace?.activate;
  useEffect(() => {
    activate?.();
  }, [activate]);

  // ── the address names the durable draft, never a queue index ─────────────
  const openDraft = workspace?.open;
  const hydrated = workspace?.hydrated ?? false;
  useEffect(() => {
    if (!draftId || !openDraft || !hydrated) return;
    let cancelled = false;
    setMissingDraft(false);
    void openDraft(draftId).then((key) => {
      if (!cancelled && key === null) setMissingDraft(true);
    });
    return () => {
      cancelled = true;
    };
  }, [draftId, hydrated, openDraft]);

  const selectedDraftId = selected?.record.draftId ?? null;
  useEffect(() => {
    if (selectedDraftId && selectedDraftId !== draftId) {
      navigate(`/creator-hub/uploads/${encodeURIComponent(selectedDraftId)}`, { replace: !draftId });
    }
  }, [draftId, navigate, selectedDraftId]);

  const select = (key: string | null) => {
    workspace?.select(key);
    setListOpen(false);
    if (key === null && draftId) navigate('/creator-hub/uploads');
  };

  /** Back to the list on small screens, with focus on the row that was open. */
  const backToList = () => {
    const key = selectedKey;
    select(null);
    if (key) setTimeout(() => rowRefs.current.get(key)?.focus(), 0);
  };

  // Focus never falls into the void when the selected draft disappears.
  const previousKeysRef = useRef<string[]>([]);
  useEffect(() => {
    const keys = items.map((item) => item.key);
    const previous = previousKeysRef.current;
    previousKeysRef.current = keys;
    const removed = previous.filter((key) => !keys.includes(key));
    if (removed.length === 0) return;
    const index = Math.max(0, previous.indexOf(removed[0]!) - 1);
    const fallback = keys[Math.min(index, keys.length - 1)];
    setTimeout(() => {
      const target = fallback ? rowRefs.current.get(fallback) : null;
      (target ?? addButtonRef.current)?.focus();
    }, 0);
  }, [items]);

  // The resume result acknowledges an action; it is not a state to live in.
  useEffect(() => {
    if (!resumeNotice) return undefined;
    const timer = setTimeout(() => setResumeNotice(null), 8_000);
    return () => clearTimeout(timer);
  }, [resumeNotice]);

  if (!workspace) return null;

  // ── adding files ─────────────────────────────────────────────────────────
  const addFiles = async (files: File[]) => {
    if (!channelId || files.length === 0) return;
    const result = await workspace.addFiles(files, channelId);
    setSelectionSummary({ added: result.added.length, rejected: result.rejected });
    if (result.added.length > 0) setAnnouncement(workspaceCopy.added(result.added.length));
  };

  /** Gives waiting videos their files back; anything else is named, not added. */
  const resumeFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const { resumed, unmatched } = await workspace.resumeWithFiles(files);
    const parts: string[] = [];
    if (resumed > 0) parts.push(workspaceCopy.resumeDone(resumed));
    if (unmatched.length > 0) parts.push(workspaceCopy.resumeUnmatched(unmatched.map((file) => file.name).join(', ')));
    setResumeNotice(parts.join(' '));
    if (resumed > 0) setAnnouncement(workspaceCopy.resumeDone(resumed));
  };

  const onDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(false);
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const dropHandlers = {
    onDrop,
    onDragOver: (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: () => setDragActive(false),
  };

  // ── page-level states ────────────────────────────────────────────────────
  if (!channelsLoading && channels.length === 0 && items.length === 0) {
    return (
      <NoChannelView
        title={workspaceCopy.noChannelTitle}
        description={workspaceCopy.noChannelBody}
        buttonText="Create a Channel"
      />
    );
  }

  const legacyEntries = queue.entries.filter((entry) => !entry.creatorDraft);
  const draftTransferring = items.some((draft) => technicalState(draft, statusContext(draft)).transferring);
  const allDurable =
    items.length > 0 &&
    !workspace.atRisk &&
    items.every((draft) => !draft.entry || !!draft.record.server?.transferConfirmed);
  // Only rows that will move bytes on their own: a row waiting for its file
  // or for a sign-in is not "sending", and holding the queue means nothing to it.
  const anyTransferring = queue.entries.some((entry) =>
    ['queued', 'reserving', 'uploading', 'retry_wait'].includes(entry.status),
  );
  const canAdd = channelId > 0;

  const dropZone = (compact: boolean) => (
    <div
      {...dropHandlers}
      className={`rounded-xl border-2 border-dashed text-center transition-colors duration-150 ${
        compact ? 'mt-3 px-4 py-4' : 'mt-4 px-6 py-16'
      } ${dragActive ? 'border-[#fa7517] bg-[#fa7517]/[0.06]' : 'border-gray-800 hover:border-gray-700'}`}
    >
      {!compact && <UploadCloud className="mx-auto h-8 w-8 text-gray-600" aria-hidden="true" />}
      {!compact && <p className="mt-4 text-sm font-medium text-gray-200">{workspaceCopy.dropTitle}</p>}
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => fileInputRef.current?.click()}
        className={`${compact ? '' : 'mt-2'} inline-flex min-h-[44px] items-center rounded px-2 text-sm text-[#fa7517]
                    underline-offset-4 transition-colors hover:text-[#ff8c3a] hover:underline disabled:text-gray-600
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60`}
      >
        {compact ? workspaceCopy.dropTitle : workspaceCopy.chooseFiles}
      </button>
      <p className={`${compact ? 'mt-1' : 'mt-3'} text-xs text-gray-600`}>{workspaceCopy.formatNote}</p>
    </div>
  );

  const destination = (
    <div className="max-w-md">
      <span className="block text-xs font-medium text-gray-400">{workspaceCopy.destinationNext}</span>
      <div className="mt-2">
        <ChannelSelector />
      </div>
      {!selectedChannelId && <p className="mt-2 text-xs text-gray-500">{workspaceCopy.selectChannelBody}</p>}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{workspaceCopy.pageTitle}</h1>
          {(draftTransferring || allDurable) && (
            <p className="mt-1 text-sm text-gray-500">
              {draftTransferring ? workspaceCopy.keepTabOpen : workspaceCopy.canCloseTab}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {anyTransferring && (
            <button
              type="button"
              aria-pressed={queue.paused}
              title={workspaceCopy.holdNextNote}
              onClick={() => queue.setPaused(!queue.paused)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm text-gray-400
                         transition-colors hover:bg-white/5 hover:text-white
                         focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
            >
              {queue.paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
              {queue.paused ? workspaceCopy.resumeNext : workspaceCopy.holdNext}
            </button>
          )}
          {items.length > 0 && (
            <button
              ref={addButtonRef}
              type="button"
              disabled={!canAdd}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#fa7517] px-4 text-sm font-medium
                         text-black transition-colors hover:bg-[#ff8c3a] disabled:bg-[#fa7517]/30
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {workspaceCopy.addVideos}
            </button>
          )}
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      {/* ── notices ───────────────────────────────────────────────────── */}
      {queue.authRequired && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/[0.05] px-3 py-2 text-sm" role="alert">
          <AlertCircle className="h-4 w-4 text-yellow-400" aria-hidden="true" />
          <span className="text-yellow-200">{workspaceCopy.sessionExpired}</span>
          <button
            type="button"
            onClick={() => void session.requestSignIn()}
            className="min-h-[44px] text-sm text-[#fa7517] hover:text-[#ff8c3a]"
          >
            {workspaceCopy.signInAgain}
          </button>
        </div>
      )}
      {!workspace.durable && (
        <p className="mt-3 text-xs text-yellow-500/80" role="status">
          {workspaceCopy.persistenceWarning}
        </p>
      )}
      {queue.persistenceError && (
        <p className="mt-2 text-xs text-yellow-500/80" role="status">
          {queue.persistenceError}
        </p>
      )}
      {workspace.listError && (
        <p className="mt-2 text-xs text-yellow-500/80" role="status">
          {workspace.listError}
        </p>
      )}
      {missingDraft && (
        <p className="mt-3 text-sm text-gray-400" role="status">
          This draft is not available on this account.{' '}
          <Link to="/creator-hub/uploads" className="text-[#fa7517] hover:text-[#ff8c3a]">
            See your videos
          </Link>
        </p>
      )}
      {selectionSummary && (selectionSummary.rejected.length > 0 || selectionSummary.added > 0) && (
        <div className="mt-4 rounded-md border border-gray-800/60 bg-[#0f0f0f] px-3 py-2 text-xs" role="status">
          <div className="flex items-start justify-between gap-3">
            <p className="text-gray-300">
              {selectionSummary.added > 0 ? workspaceCopy.added(selectionSummary.added) : ''}
              {selectionSummary.added > 0 && selectionSummary.rejected.length > 0 ? ' · ' : ''}
              {selectionSummary.rejected.length > 0 ? workspaceCopy.skipped(selectionSummary.rejected.length) : ''}
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setSelectionSummary(null)}
              className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center text-gray-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          {selectionSummary.rejected.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-gray-500">
              {selectionSummary.rejected.map((rejected, index) => (
                <li key={`${rejected.file.name}-${index}`}>
                  <span className="text-gray-300">{rejected.file.name}</span> — {rejected.message}
                </li>
              ))}
            </ul>
          )}
          {selectionSummary.rejected.some((rejected) => rejected.code === 'QUEUE_FULL' || rejected.code === 'SESSION_FULL') && (
            <p className="mt-1 text-gray-600">{workspaceCopy.limits}</p>
          )}
        </div>
      )}

      {/* ── resume: one place to give every waiting video its file back ── */}
      {workspace.waitingForFile.length > 0 && (
        <section
          aria-label={workspaceCopy.resumeTitle(workspace.waitingForFile.length)}
          onDragOver={(event) => {
            event.preventDefault();
            setResumeDrag(true);
          }}
          onDragLeave={() => setResumeDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setResumeDrag(false);
            void resumeFiles(Array.from(event.dataTransfer.files ?? []));
          }}
          className={`mt-6 rounded-lg border p-4 transition-colors ${
            resumeDrag ? 'border-[#fa7517] bg-[#fa7517]/[0.06]' : 'border-yellow-500/30 bg-yellow-500/[0.04]'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h2 className="flex items-center gap-2 text-base font-medium text-yellow-100">
                <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400" aria-hidden="true" />
                {workspaceCopy.resumeTitle(workspace.waitingForFile.length)}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{workspaceCopy.resumeBody}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {workspace.waitingForFile.map((waiting) => (
                  <li key={waiting.key} className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-gray-200" title={waiting.filename}>
                      {waiting.filename}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">{formatBytes(waiting.sizeBytes)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#fa7517] px-4 text-sm font-medium
                           text-black transition-colors hover:bg-[#ff8c3a]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {workspaceCopy.resumeAction}
              </button>
              <span className="text-xs text-gray-500">{workspaceCopy.resumeDrop}</span>
            </div>
          </div>
          <input
            ref={resumeInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(event) => {
              void resumeFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
        </section>
      )}
      {resumeNotice && (
        <p className="mt-2 text-sm text-gray-300" role="status">
          {resumeNotice}
        </p>
      )}

      {/* ── empty state: destination first, then one large target ─────── */}
      {items.length === 0 && (
        <section className="mt-8" aria-label={workspaceCopy.dropTitle}>
          {destination}
          {selectedChannelId ? dropZone(false) : null}
        </section>
      )}

      {/* ── list and editor ───────────────────────────────────────────── */}
      {/* Layout is chosen in JS (useWorkspaceLayout), never with responsive
          display classes: a dependency's stylesheet overrides those. */}
      {items.length > 0 && (
        <div
          className="mt-6"
          style={
            sideBySide
              ? { display: 'grid', gridTemplateColumns: '18rem minmax(0, 1fr)', columnGap: '1.5rem', alignItems: 'start' }
              : undefined
          }
        >
          {showList && (
            <div className="min-w-0">
              {listFoldable && (
                <button
                  type="button"
                  aria-expanded={listOpen}
                  aria-controls="upload-workspace-list"
                  onClick={() => setListOpen((open) => !open)}
                  className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm text-gray-300 hover:bg-white/5"
                >
                  {listOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  {workspaceCopy.videosList} ({items.length})
                </button>
              )}
              {(!listFoldable || listOpen) && (
                <div id="upload-workspace-list" className={listFoldable ? 'mb-6' : undefined}>
                  <DraftList
                    items={items}
                    selectedKey={selectedKey}
                    onSelect={select}
                    statusContext={statusContext}
                    thumbnailUrl={workspace.thumbnailPreviewUrl}
                    channelName={(id) => channelById(id)?.name ?? null}
                    showChannel={channels.length > 1}
                    isReady={(key) => workspace.readiness(key).ready}
                    hasMore={workspace.hasMore}
                    onLoadMore={() => void workspace.loadMore()}
                    rowRefs={rowRefs}
                  />
                  {!selected && (
                    <>
                      <div className="mt-6">{destination}</div>
                      {selectedChannelId ? dropZone(true) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="min-w-0">
              <DraftEditor
                key={selected.key}
                draft={selected}
                workspace={workspace}
                technical={technicalState(selected, statusContext(selected))}
                channel={channelById(selected.record.channelId)}
                layout={layout}
                onBack={backToList}
                onClose={backToList}
                onAnnounce={setAnnouncement}
              />
              {/* New files go to the selector's channel; the open video keeps its own. */}
              <div className="mt-6">{destination}</div>
              {selectedChannelId ? dropZone(true) : null}
            </div>
          )}
        </div>
      )}

      {/* ── uploads started before the workspace: shown until resolved ─── */}
      {legacyEntries.length > 0 && (
        <section className="mt-10" aria-label={workspaceCopy.earlierUploads}>
          <h2 className="text-sm font-medium text-gray-300">{workspaceCopy.earlierUploads}</h2>
          <p className="mt-0.5 text-xs text-gray-600">{workspaceCopy.earlierUploadsNote}</p>
          {queue.actionError && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {describeUploadError(queue.actionError.code, queue.actionError.message)}
            </p>
          )}
          <ul className="mt-3 divide-y divide-gray-800/60 overflow-hidden rounded-lg border border-gray-800/60 bg-[#0f0f0f]">
            {legacyEntries.map((entry) => (
              <UploadRow
                key={entry.localId}
                entry={entry}
                onCancel={() => void queue.abortEntry(entry.localId)}
                onRetry={() => void queue.replaceAttempt(entry.localId)}
                onDismiss={() => void queue.removeEntry(entry.localId)}
                onReselect={() => legacyReselectRef.current?.click()}
              />
            ))}
          </ul>
          <input
            ref={legacyReselectRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(event) => {
              void queue.reselectFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <Link
            to="/creator-hub/videos"
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-gray-400 hover:text-white"
          >
            Videos Management
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
};

export default UploadWorkspace;
