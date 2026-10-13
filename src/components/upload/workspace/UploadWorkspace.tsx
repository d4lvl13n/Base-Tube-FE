// src/components/upload/workspace/UploadWorkspace.tsx

/**
 * The single place to add and prepare videos (UP-UX), built on the
 * AmazingAerial single-screen workspace (ADR-0025, `IntakeWorkspace`):
 *
 *   - before any file: one large drop target with its limits;
 *   - then a grid of tiles, one per video, each saying in a word where its
 *     file stands; files start sending the moment they are chosen;
 *   - clicking a tile opens the inspector on the right for that video only
 *     (title, description, thumbnail, preview, Publish, previous / next);
 *   - one command row at the bottom: the summary on the left, the next
 *     useful action on the right.
 *
 * Layout is decided in JS (`useWorkspaceLayout`) and placed with inline
 * styles: a dependency's stylesheet overrides responsive display classes.
 *   ≥ 1200 px  the inspector is a column beside the grid;
 *   768–1199   it slides over the grid, with a backdrop;
 *   < 768      it takes the screen, and closing returns to the grid.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Pause, Play, X } from 'lucide-react';
import type { RejectedUploadFile } from '@basetube/api';
import { useDraftWorkspaceContext } from '../../../contexts/DraftWorkspaceContext';
import { useUploadQueueContext, useUploadSession } from '../../../contexts/UploadQueueContext';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';
import NoChannelView from '../../pages/CreatorHub/NoChannelView';
import { UploadRow } from '../../pages/CreatorHub/ContentStudio';
import { describeUploadError } from '../uploadCopy';
import DraftEditor from './DraftEditor';
import DraftTile from './DraftTile';
import { isPublished, technicalState, type StatusContext, type TechnicalState } from './draftStatus';
import { workspaceCopy } from './workspaceCopy';
import { useWorkspaceLayout } from './useWorkspaceLayout';

const ACCEPTED = '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo';
/** The Creator Hub header is `h-16`; the inspector starts under it (AA `top: 64px`). */
const HEADER_HEIGHT = 64;
const INSPECTOR_WIDTH = 'clamp(440px, 40vw, 760px)';

const PRIMARY =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-[#fa7517] px-4 text-sm font-medium text-black ' +
  'transition-colors hover:bg-[#ff8c3a] disabled:cursor-not-allowed disabled:bg-[#fa7517]/30 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60';
const GHOST =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm text-gray-200 ' +
  'transition-colors hover:border-white/30 hover:text-white disabled:opacity-40 ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';
const TEXT_ACTION =
  'inline-flex min-h-[40px] items-center gap-1.5 rounded px-2 text-sm text-gray-300 transition-colors hover:text-white ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500';

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

/** The text action a tile carries under it, when the file needs the creator. */
function tileActionLabel(technical: TechnicalState): string | null {
  switch (technical.action) {
    case 'choose_file':
    case 'send_again':
      return workspaceCopy.chooseFile;
    case 'sign_in':
      return workspaceCopy.signInAgain;
    case 'retry_now':
      return workspaceCopy.retryNow;
    case 'retry_create':
      return workspaceCopy.retry;
    default:
      return null;
  }
}

const UploadWorkspace: React.FC = () => {
  const workspace = useDraftWorkspaceContext();
  const queue = useUploadQueueContext();
  const session = useUploadSession();
  const { channels, selectedChannelId, selectedChannel, isLoading: channelsLoading } = useChannelSelection();
  const { draftId } = useParams<{ draftId?: string }>();
  const navigate = useNavigate();
  const online = useOnline();
  const layout = useWorkspaceLayout();

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const legacyReselectRef = useRef<HTMLInputElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  /** The tile whose "Choose file" opened the picker. */
  const attachKeyRef = useRef<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<{ added: number; rejected: RejectedUploadFile[]; resume: string | null } | null>(
    null,
  );
  const [tileMessage, setTileMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [missingDraft, setMissingDraft] = useState(false);

  const workspaceItems = workspace?.items;
  const items = useMemo(() => workspaceItems ?? [], [workspaceItems]);
  const selectedKey = workspace?.selectedKey ?? null;
  const selectedIndex = items.findIndex((item) => item.key === selectedKey);
  const selected = selectedIndex >= 0 ? items[selectedIndex]! : null;
  const channelId = selectedChannelId ? Number(selectedChannelId) : 0;
  const channelById = useCallback((id: number) => channels.find((channel) => Number(channel.id) === id), [channels]);

  const statusContext = useCallback(
    (draft: WorkspaceDraft): StatusContext => ({
      cancelling: !!draft.entry && !!queue.cancellingIds?.has(draft.entry.localId),
      heldElsewhere: !!draft.entry && !!queue.heldElsewhereIds?.has(draft.entry.localId),
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
    if (!draftId || !openDraft || !hydrated) return undefined;
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

  const open = (key: string | null) => {
    workspace?.select(key);
    if (key === null && draftId) navigate('/creator-hub/uploads');
  };

  /** Closing the inspector returns focus to the tile it described. */
  const closeInspector = () => {
    const key = selectedKey;
    open(null);
    if (key) setTimeout(() => tileRefs.current.get(key)?.focus(), 0);
  };

  // Focus never falls into the void when a video disappears (deleted).
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
      const target = fallback ? tileRefs.current.get(fallback) : null;
      (target ?? addButtonRef.current)?.focus();
    }, 0);
  }, [items]);

  // A notice acknowledges an action; it is not a state to live in.
  useEffect(() => {
    if (!notice || notice.rejected.length > 0) return undefined;
    const timer = setTimeout(() => setNotice(null), 8_000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!workspace) return null;

  // ── actions ──────────────────────────────────────────────────────────────
  const addFiles = async (files: File[]) => {
    if (!channelId || files.length === 0) return;
    const result = await workspace.addFiles(files, channelId);
    setNotice({ added: result.added.length, rejected: result.rejected, resume: null });
    if (result.added.length > 0) setAnnouncement(workspaceCopy.added(result.added.length));
  };

  /** Gives waiting videos their files back; anything else is named, never added. */
  const resumeFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const { resumed, unmatched } = await workspace.resumeWithFiles(files);
    const parts: string[] = [];
    if (resumed > 0) parts.push(workspaceCopy.resumeDone(resumed));
    if (unmatched.length > 0) parts.push(workspaceCopy.resumeUnmatched(unmatched.map((file) => file.name).join(', ')));
    setNotice({ added: 0, rejected: [], resume: parts.join(' ') });
    if (resumed > 0) setAnnouncement(workspaceCopy.resumeDone(resumed));
  };

  const runTileAction = (draft: WorkspaceDraft, technical: TechnicalState) => {
    setTileMessage(null);
    switch (technical.action) {
      case 'choose_file':
      case 'send_again':
        attachKeyRef.current = draft.key;
        attachInputRef.current?.click();
        break;
      case 'sign_in':
        void session.requestSignIn();
        break;
      case 'retry_now':
        if (draft.entry) void queue.retryEntry(draft.entry.localId);
        break;
      case 'retry_create':
        workspace.retryCreate(draft.key);
        break;
      default:
        break;
    }
  };

  // ── page-level states ────────────────────────────────────────────────────
  if (!channelsLoading && channels.length === 0 && items.length === 0) {
    return (
      <NoChannelView title={workspaceCopy.noChannelTitle} description={workspaceCopy.noChannelBody} buttonText="Create a Channel" />
    );
  }

  const legacyEntries = queue.entries.filter((entry) => !entry.creatorDraft);
  const technicalByKey = new Map(items.map((draft) => [draft.key, technicalState(draft, statusContext(draft))]));
  const waiting = workspace.waitingForFile.length;
  const sending = items.filter((draft) => technicalByKey.get(draft.key)?.transferring).length;
  const readyCount = items.filter((draft) => !isPublished(draft) && workspace.readiness(draft.key).ready).length;
  const publishedCount = items.filter(isPublished).length;
  const anyQueued = queue.entries.some((entry) => ['queued', 'reserving', 'uploading', 'retry_wait'].includes(entry.status));
  const allDurable =
    items.length > 0 && !workspace.atRisk && items.every((draft) => !draft.entry || !!draft.record.server?.transferConfirmed);
  const empty = items.length === 0 && legacyEntries.length === 0;
  const inspectorBeside = !!selected && layout === 'wide';

  const summaryParts = [
    sending > 0 ? workspaceCopy.summarySending(sending) : null,
    waiting > 0 ? workspaceCopy.summaryWaiting(waiting) : null,
    readyCount > 0 ? workspaceCopy.summaryReady(readyCount) : null,
    publishedCount > 0 ? workspaceCopy.summaryPublished(publishedCount) : null,
  ].filter(Boolean);

  const pageDrop = {
    onDragOver: (event: React.DragEvent<HTMLElement>) => {
      if (!event.dataTransfer.types.includes('Files')) return;
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: (event: React.DragEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setDragActive(false);
    },
    onDrop: (event: React.DragEvent<HTMLElement>) => {
      if (!event.dataTransfer.files.length) return;
      event.preventDefault();
      setDragActive(false);
      void addFiles(Array.from(event.dataTransfer.files));
    },
  };

  const hiddenInputs = (
    <>
      <input
        ref={addInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        aria-label={workspaceCopy.addVideos}
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <input
        ref={resumeInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        aria-label={workspaceCopy.resumeAction}
        onChange={(event) => {
          void resumeFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <input
        ref={attachInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        aria-label={workspaceCopy.chooseFile}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const key = attachKeyRef.current;
          event.target.value = '';
          if (!file || !key) return;
          void workspace.attachFile(key, file).then(setTileMessage);
        }}
      />
    </>
  );

  // ── start: one large target (AA `df-start` / `df-dropzone`) ──────────────
  if (empty) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14" aria-labelledby="upload-start-title">
        <h1 id="upload-start-title" className="text-2xl font-semibold tracking-tight text-white">
          {workspaceCopy.pageTitle}
        </h1>
        <div className="mt-6 max-w-sm">
          <span className="block text-xs font-medium text-gray-400">{workspaceCopy.destinationNext}</span>
          <div className="mt-2">
            <ChannelSelector />
          </div>
        </div>
        <div
          {...pageDrop}
          className="mt-6 grid items-center gap-6 rounded-2xl border border-dashed px-8 py-10 transition-colors"
          style={{
            gridTemplateColumns: layout === 'compact' ? '1fr' : 'auto minmax(0, 1fr) auto',
            textAlign: layout === 'compact' ? 'center' : 'left',
            borderColor: dragActive ? '#fa7517' : 'rgba(250,117,23,0.45)',
            background: `radial-gradient(circle at 10% 50%, rgba(250,117,23,${dragActive ? 0.14 : 0.07}), transparent 32%), #0f0f0f`,
          }}
        >
          <span
            className="grid h-14 w-14 place-items-center rounded-full border text-2xl font-light text-[#fa7517]"
            style={{ borderColor: 'rgba(250,117,23,0.4)', margin: layout === 'compact' ? '0 auto' : undefined }}
            aria-hidden="true"
          >
            ↑
          </span>
          <div className="grid gap-1.5">
            <strong className="text-xl font-semibold text-white">{workspaceCopy.dropTitle}</strong>
            <p className="text-sm text-gray-400">{workspaceCopy.dropBody}</p>
            <small className="text-[11px] font-medium text-gray-600">{workspaceCopy.formatNote}</small>
          </div>
          <button type="button" disabled={!channelId} onClick={() => addInputRef.current?.click()} className={PRIMARY}>
            {workspaceCopy.chooseFiles}
          </button>
        </div>
        {!channelId && <p className="mt-3 text-sm text-gray-500">{workspaceCopy.selectChannelBody}</p>}
        {notice?.rejected.length ? <RejectedNotice notice={notice} onDismiss={() => setNotice(null)} /> : null}
        {hiddenInputs}
      </section>
    );
  }

  // ── workspace: grid, command row, inspector ──────────────────────────────
  return (
    <section
      aria-labelledby="upload-workspace-title"
      {...pageDrop}
      className="relative flex flex-col px-4 pb-0 pt-5 sm:px-6"
      style={{ paddingRight: inspectorBeside ? `calc(${INSPECTOR_WIDTH} + 1.5rem)` : undefined, minHeight: `calc(100vh - ${HEADER_HEIGHT}px)` }}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 id="upload-workspace-title" className="text-xl font-semibold text-white">
            {workspaceCopy.pageTitle}
          </h1>
          {selectedChannel && (
            <span className="text-xs text-gray-500">
              {workspaceCopy.destinationNext} <span className="text-gray-300">{selectedChannel.name}</span>
            </span>
          )}
        </div>
        <button
          ref={addButtonRef}
          type="button"
          disabled={!channelId}
          onClick={() => addInputRef.current?.click()}
          className={GHOST}
        >
          {workspaceCopy.addVideos}
        </button>
      </header>

      {hiddenInputs}

      {/* Short, one per kind; each says what to do. */}
      <div className="space-y-2">
        {queue.authRequired && (
          <Alert tone="warning">
            {workspaceCopy.sessionExpired}{' '}
            <button type="button" onClick={() => void session.requestSignIn()} className="font-medium text-[#fa7517] hover:text-[#ff8c3a]">
              {workspaceCopy.signInAgain}
            </button>
          </Alert>
        )}
        {!workspace.durable && <Alert tone="warning">{workspaceCopy.persistenceWarning}</Alert>}
        {queue.persistenceError && <Alert tone="warning">{queue.persistenceError}</Alert>}
        {workspace.listError && <Alert tone="warning">{workspace.listError}</Alert>}
        {missingDraft && (
          <Alert tone="info">
            {workspaceCopy.missingDraft}{' '}
            <Link to="/creator-hub/uploads" className="font-medium text-[#fa7517] hover:text-[#ff8c3a]">
              {workspaceCopy.seeVideos}
            </Link>
          </Alert>
        )}
        {notice && notice.rejected.length > 0 && <RejectedNotice notice={notice} onDismiss={() => setNotice(null)} />}
        {notice?.resume && <Alert tone="info">{notice.resume}</Alert>}
        {tileMessage && <Alert tone="warning">{tileMessage}</Alert>}
        {dragActive && <Alert tone="info">{workspaceCopy.dropToAdd}</Alert>}
      </div>

      {items.length > 0 && (
        <div
          className="mt-4"
          style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${layout === 'compact' ? 150 : 210}px, 1fr))`, gap: 12 }}
        >
          {items.map((draft) => {
            const technical = technicalByKey.get(draft.key)!;
            const label = tileActionLabel(technical);
            return (
              <DraftTile
                key={draft.key}
                draft={draft}
                technical={technical}
                selected={draft.key === selectedKey}
                ready={!isPublished(draft) && workspace.readiness(draft.key).ready}
                thumbnailUrl={workspace.thumbnailPreviewUrl(draft.key)}
                inlineAction={label ? { label, onClick: () => runTileAction(draft, technical) } : null}
                onOpen={() => open(draft.key === selectedKey ? null : draft.key)}
                tileRef={(node) => {
                  if (node) tileRefs.current.set(draft.key, node);
                  else tileRefs.current.delete(draft.key);
                }}
              />
            );
          })}
        </div>
      )}
      {workspace.hasMore && (
        <button type="button" onClick={() => void workspace.loadMore()} className={`${TEXT_ACTION} mt-3`}>
          {workspaceCopy.loadMore}
        </button>
      )}

      {/* Uploads started before this workspace keep their rows until resolved. */}
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
          <Link to="/creator-hub/videos" className={`${TEXT_ACTION} mt-3 -ml-2 text-xs`}>
            Videos Management
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      )}

      <div className="h-8 shrink-0" aria-hidden="true" />

      {/* The one command row (AA `ig-action-bar`): where things stand, then
          the next useful action. Publishing is per video, in the inspector. */}
      {items.length > 0 && (
        <footer
          aria-label={workspaceCopy.commands}
          // Pinned to the bottom of the screen even with a short grid.
          style={{ marginTop: 'auto' }}
          className="sticky bottom-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-white/20
                     bg-[#09090B]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
        >
          <div className="min-w-0" role="status">
            <strong className="block text-[13px] font-semibold text-white">
              {workspaceCopy.summaryCount(items.length)}
              {summaryParts.length > 0 ? ` · ${summaryParts.join(' · ')}` : ''}
            </strong>
            <span className="block text-xs text-gray-400">
              {sending > 0 ? workspaceCopy.keepTabOpen : allDurable ? workspaceCopy.canCloseTab : workspaceCopy.commandsHint}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {anyQueued && (
              <button
                type="button"
                aria-pressed={queue.paused}
                title={workspaceCopy.holdNextNote}
                onClick={() => queue.setPaused(!queue.paused)}
                className={TEXT_ACTION}
              >
                {queue.paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                {queue.paused ? workspaceCopy.resumeNext : workspaceCopy.holdNext}
              </button>
            )}
            {waiting > 0 ? (
              <button type="button" onClick={() => resumeInputRef.current?.click()} className={PRIMARY}>
                {waiting === 1 ? workspaceCopy.resumeActionOne : workspaceCopy.resumeActionCount(waiting)}
              </button>
            ) : (
              <button type="button" disabled={!channelId} onClick={() => addInputRef.current?.click()} className={PRIMARY}>
                {workspaceCopy.addVideos}
              </button>
            )}
          </div>
        </footer>
      )}

      {/* The inspector (AA `ig-inspector`): one video, under the site header. */}
      {selected && (
        <>
          {layout === 'medium' && (
            <div
              className="fixed inset-x-0 bottom-0 z-40 bg-black/60"
              style={{ top: HEADER_HEIGHT }}
              aria-hidden="true"
              onClick={closeInspector}
            />
          )}
          <aside
            aria-label={workspaceCopy.inspector}
            className="fixed bottom-0 right-0 z-40 border-l border-white/10 bg-[#09090B] shadow-2xl"
            style={{
              top: HEADER_HEIGHT,
              width: layout === 'wide' ? INSPECTOR_WIDTH : layout === 'medium' ? 'min(600px, 92vw)' : '100vw',
            }}
            onKeyDown={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('input,textarea,select,[contenteditable="true"]')) return;
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeInspector();
              }
            }}
          >
            <DraftEditor
              key={selected.key}
              draft={selected}
              workspace={workspace}
              technical={technicalByKey.get(selected.key)!}
              channel={channelById(selected.record.channelId)}
              layout={layout === 'compact' ? 'compact' : 'medium'}
              onClose={closeInspector}
              onPrevious={selectedIndex > 0 ? () => open(items[selectedIndex - 1]!.key) : null}
              onNext={selectedIndex < items.length - 1 ? () => open(items[selectedIndex + 1]!.key) : null}
              onAnnounce={setAnnouncement}
            />
          </aside>
        </>
      )}
    </section>
  );
};

function Alert({ tone, children }: { tone: 'warning' | 'info'; children: React.ReactNode }) {
  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm ${
        tone === 'warning' ? 'border-yellow-500/25 bg-yellow-500/[0.05] text-yellow-100' : 'border-white/10 bg-white/[0.03] text-gray-300'
      }`}
      role="status"
    >
      {children}
    </p>
  );
}

function RejectedNotice({
  notice,
  onDismiss,
}: {
  notice: { added: number; rejected: RejectedUploadFile[] };
  onDismiss: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-yellow-500/25 bg-yellow-500/[0.05] px-3 py-2 text-sm" role="status">
      <div className="flex items-start justify-between gap-3">
        <p className="text-yellow-100">
          {notice.added > 0 ? `${workspaceCopy.added(notice.added)} · ` : ''}
          {workspaceCopy.skipped(notice.rejected.length)}
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-m-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <ul className="mt-1 space-y-0.5 text-xs text-gray-400">
        {notice.rejected.map((rejected, index) => (
          <li key={`${rejected.file.name}-${index}`}>
            <span className="text-gray-200">{rejected.file.name}</span> — {rejected.message}
          </li>
        ))}
      </ul>
      {notice.rejected.some((rejected) => rejected.code === 'QUEUE_FULL' || rejected.code === 'SESSION_FULL') && (
        <p className="mt-1 text-xs text-gray-500">{workspaceCopy.limits}</p>
      )}
    </div>
  );
}

export default UploadWorkspace;
