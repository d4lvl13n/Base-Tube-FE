import React, { useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pause, Play, RotateCcw, Upload, X } from 'lucide-react';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../hooks/useUploadQueue';
import { phaseDetail, phaseLabel, uploadPhase, type UploadPhase } from './uploadPhase';

/** Colour per phase — one vocabulary, shared with the Content Studio. */
const PHASE_TONE: Record<UploadPhase, string> = {
  uploading: 'text-[#fa7517]',
  processing: 'text-blue-400',
  ready: 'text-green-500',
  failed: 'text-red-500',
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

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
  const reselectInput = useRef<HTMLInputElement>(null);
  const needsReselect = queue.entries.some((entry) => entry.status === 'reselect_required');
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

  return (
    <section
      aria-label="Upload queue"
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
      </header>

      {!collapsed && (
        <div className="max-h-[22rem] overflow-y-auto">
          {needsReselect && (
            <div className="px-4 py-3 border-b border-gray-800/60 bg-yellow-500/5">
              <p className="text-xs text-yellow-200 mb-2">
                Reselect the same files to resume — only the missing parts are sent.
              </p>
              <button
                type="button"
                onClick={() => reselectInput.current?.click()}
                className="px-3 py-1.5 text-xs rounded-lg bg-yellow-500/20 text-yellow-100 hover:bg-yellow-500/30"
              >
                Choose files
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
              {queue.actionError}
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
                    <p className="flex-1 min-w-0 truncate text-xs text-gray-500">{rowDetail(entry)}</p>
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
