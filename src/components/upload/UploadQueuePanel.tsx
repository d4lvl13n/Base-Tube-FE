import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pause, Play, RotateCcw, Upload, X } from 'lucide-react';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../hooks/useUploadQueue';
import { describeUploadError, uploadCopy } from './uploadCopy';
import { formatBytes, phaseDetail, phaseLabel, uploadPhase, type UploadPhase } from './uploadPhase';

/** After this long with nothing left to report, the panel folds to its header. */
export const IDLE_COLLAPSE_MS = 30_000;

/** Colour per phase — one vocabulary, shared with the Content Studio. */
const PHASE_TONE: Record<UploadPhase, string> = {
  uploading: 'text-[#fa7517]',
  processing: 'text-blue-400',
  ready: 'text-green-500',
  failed: 'text-red-500',
};

/** What the row is waiting on, in the creator's terms. */
function rowDetail(entry: UploadQueueViewEntry): string {
  const phase = uploadPhase(entry);
  if (phase === 'uploading') return `${formatBytes(entry.sizeBytes)} · ${phaseDetail(entry)}`;
  return phaseDetail(entry);
}

interface UploadQueuePanelProps {
  queue: UploadQueueApi;
}

/**
 * The always-available upload drawer. It is rendered by the provider, so the
 * creator keeps seeing progress after navigating away from the upload page.
 */
const UploadQueuePanel: React.FC<UploadQueuePanelProps> = ({ queue }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState(false);
  const reselectInput = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const needsReselect = queue.entries.some((entry) => entry.status === 'reselect_required');
  const phases = queue.entries.map(uploadPhase);
  /** Nothing is uploading or transcoding: every row has finished its story. */
  const allSettled =
    phases.length > 0 && phases.every((phase) => phase === 'ready' || phase === 'failed');
  const hasFinished = phases.some((phase) => phase === 'ready' || phase === 'failed');
  /** Restarts the idle countdown whenever any row's phase moves. */
  const activityKey = phases.join(',');

  /** Rows the panel has already shown, and which of them were still working. */
  const seenIdsRef = useRef<Set<string>>(new Set());
  const workingIdsRef = useRef<Set<string>>(new Set());

  // A close dismisses the queue *as it stands*. Genuinely new news brings the
  // panel back: another file enqueued, or a row that starts working again
  // (a retry, a replaced attempt). A row merely finishing does not — that is
  // exactly what the creator closed the panel on.
  useEffect(() => {
    const working = new Set<string>();
    let reopen = false;
    for (const entry of queue.entries) {
      if (!seenIdsRef.current.has(entry.localId)) {
        seenIdsRef.current.add(entry.localId);
        reopen = true;
      }
      const phase = uploadPhase(entry);
      if (phase === 'uploading' || phase === 'processing') {
        working.add(entry.localId);
        if (!workingIdsRef.current.has(entry.localId)) reopen = true;
      }
    }
    workingIdsRef.current = working;
    if (reopen) {
      setClosed(false);
      setCollapsed(false);
    }
  }, [queue.entries]);

  // Everything is done and the creator has not touched the panel: fold it to
  // its header rather than hiding it, so the summary line stays readable.
  useEffect(() => {
    if (!allSettled) return;
    const timer = setTimeout(() => setCollapsed(true), IDLE_COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [allSettled, activityKey]);

  // Any interaction with the panel is an acknowledgement of the notice.
  const acknowledge = useCallback(() => {
    if (queue.selectionNotice !== null) queue.dismissSelectionNotice();
  }, [queue]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setClosed(true);
  }, []);

  const counts = queue.entries.reduce(
    (acc, entry) => ({ ...acc, [uploadPhase(entry)]: acc[uploadPhase(entry)] + 1 }),
    { uploading: 0, processing: 0, ready: 0, failed: 0 } as Record<UploadPhase, number>,
  );
  const headline = (
    [
      [counts.uploading, 'uploading'],
      [counts.processing, 'processing'],
      [counts.ready, 'ready'],
      [counts.failed, 'failed'],
    ] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(' · ');

  if (closed) return null;

  return (
    <section
      ref={panelRef}
      aria-label="Upload queue"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPointerDown={acknowledge}
      onFocus={acknowledge}
      className="fixed bottom-4 right-4 z-[60] w-[min(26rem,calc(100vw-2rem))] rounded-xl
                 border border-gray-800/60 bg-black/90 backdrop-blur-sm shadow-2xl"
    >
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60">
        <Upload className="w-4 h-4 text-[#fa7517]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Uploads{headline ? ` · ${headline}` : ''}
          </p>
          {queue.persistenceError && (
            <p className="text-xs text-yellow-400 truncate">{queue.persistenceError}</p>
          )}
        </div>
        {/* Only offered when there is actually something finished to sweep. */}
        {hasFinished && (
          <button
            type="button"
            onClick={() => {
              acknowledge();
              void queue.clearFinished();
            }}
            className="shrink-0 px-2 py-1 text-xs rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
          >
            Clear finished
          </button>
        )}
        <button
          type="button"
          aria-label={queue.paused ? 'Resume uploads' : 'Pause uploads'}
          onClick={() => queue.setPaused(!queue.paused)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
        >
          {queue.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button
          type="button"
          aria-label={collapsed ? 'Expand upload queue' : 'Collapse upload queue'}
          onClick={() => setCollapsed((value) => !value)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {/* The panel had no way out: an upload that failed at 3 a.m. sat over
            the page until the tab was closed. Uploads keep running. */}
        <button
          type="button"
          aria-label="Close upload queue"
          onClick={() => setClosed(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!collapsed && (
        <div className="max-h-[22rem] overflow-y-auto">
          {needsReselect && (
            <div className="px-4 py-3 border-b border-gray-800/60 bg-yellow-500/5">
              <p className="text-xs text-yellow-200 mb-2">{uploadCopy.reselectRequired}</p>
              <button
                type="button"
                onClick={() => reselectInput.current?.click()}
                className="px-3 py-1.5 text-xs rounded-lg bg-yellow-500/20 text-yellow-100 hover:bg-yellow-500/30"
              >
                {uploadCopy.reselectAction}
              </button>
              <input
                ref={reselectInput}
                type="file"
                multiple
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
                className="hidden"
                onChange={(event) => {
                  void queue.reselectFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
            </div>
          )}

          {queue.selectionNotice && (
            <p className="px-4 py-2 text-xs text-gray-400" role="status">
              {queue.selectionNotice}
            </p>
          )}

          {queue.actionError && (
            <p className="px-4 py-2 text-xs text-red-400" role="alert">
              {describeUploadError(queue.actionError.code, queue.actionError.message)}
            </p>
          )}

          <ul>
            {queue.entries.map((entry) => {
              const phase = uploadPhase(entry);
              return (
                <li key={entry.localId} className="px-4 py-3 border-b border-gray-800/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 min-w-0 truncate text-sm text-white" title={entry.filename}>
                      {entry.filename}
                    </p>
                    <span
                      className={`text-xs shrink-0 inline-flex items-center gap-1 ${PHASE_TONE[phase]}`}
                    >
                      {phase === 'ready' && <Check className="w-3 h-3" />}
                      {phaseLabel(entry)}
                    </span>
                  </div>

                  {/* Processing has no honest percentage: a pulsing bar, and the
                      rendition line below carries the actual news. */}
                  {phase === 'processing' ? (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full w-full bg-blue-500/60 animate-pulse" />
                    </div>
                  ) : (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={
                          phase === 'failed'
                            ? 'h-full bg-red-500'
                            : phase === 'ready'
                              ? 'h-full bg-green-500'
                              : 'h-full bg-[#fa7517]'
                        }
                        style={{ width: `${phase === 'uploading' ? entry.progress : 100}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-3">
                    {/* The failure sentences are long on purpose; the row
                        truncates, so the full text lives in the tooltip. */}
                    <p
                      className="flex-1 min-w-0 truncate text-xs text-gray-500"
                      title={rowDetail(entry)}
                    >
                      {rowDetail(entry)}
                    </p>
                    {/* Cancel only while bytes are moving; once the video exists
                        there is nothing left here to cancel. */}
                    {phase === 'uploading' && (
                      <button
                        type="button"
                        onClick={() => void queue.abortEntry(entry.localId)}
                        className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    )}
                    {entry.status === 'retry_wait' && (
                      <button
                        type="button"
                        onClick={() => void queue.retryEntry(entry.localId)}
                        className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry now
                      </button>
                    )}
                    {phase === 'ready' && (
                      <button
                        type="button"
                        onClick={() => void queue.removeEntry(entry.localId)}
                        className="text-xs text-gray-500 hover:text-white"
                      >
                        Dismiss
                      </button>
                    )}
                    {phase === 'failed' && entry.videoId === null && (
                      <>
                        <button
                          type="button"
                          onClick={() => void queue.replaceAttempt(entry.localId)}
                          className="text-xs text-[#fa7517] hover:text-[#ff8c3a]"
                        >
                          Try again
                        </button>
                        <button
                          type="button"
                          onClick={() => void queue.removeEntry(entry.localId)}
                          className="text-xs text-gray-500 hover:text-white"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    {phase === 'failed' && entry.videoId !== null && (
                      <button
                        type="button"
                        onClick={() => void queue.removeEntry(entry.localId)}
                        className="text-xs text-gray-500 hover:text-white"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default UploadQueuePanel;
