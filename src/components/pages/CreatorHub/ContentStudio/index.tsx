// src/components/pages/CreatorHub/ContentStudio/index.tsx

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileVideo,
  Pause,
  Play,
  Plus,
  UploadCloud,
  X,
} from 'lucide-react';
import type { UploadQueueViewEntry } from '../../../../hooks/useUploadQueue';
import { Container } from './styles';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import NoChannelView from '../NoChannelView';
import { useUploadQueueContext } from '../../../../contexts/UploadQueueContext';
import { describeUploadError } from '../../../upload/uploadCopy';
import { formatBytes, phaseDetail, phaseLabel, uploadPhase } from '../../../upload/uploadPhase';
import { summarizeEntries, summarySegments, type SummaryTone } from './summary';

/** Files accepted in one selection — the client-side ceiling from contract 4. */
const MAX_FILES = 50;

const ACCEPTED = '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo';

/** Colour carries meaning here, so there are only four of them. */
const TONE: Record<SummaryTone, string> = {
  muted: 'text-gray-500',
  active: 'text-[#fa7517]',
  ready: 'text-green-500',
  failed: 'text-red-400',
};

/**
 * One row, one sentence.
 *
 * A percentage is only honest while bytes are moving, so it is glued to the
 * `Uploading` label and nowhere else; every other phase reads `Label · detail`.
 */
export function phaseParts(entry: UploadQueueViewEntry): { label: string; percent: string | null } {
  const phase = uploadPhase(entry);
  const label = phaseLabel(entry);
  if (phase === 'ready') return { label, percent: null };
  if (phase === 'uploading') {
    return {
      label,
      percent: entry.status === 'uploading' ? `${entry.progress}%` : null,
    };
  }
  return { label: `${label} · ${phaseDetail(entry)}`, percent: null };
}

export function phaseText(entry: UploadQueueViewEntry): string {
  const { label, percent } = phaseParts(entry);
  return percent ? `${label} ${percent}` : label;
}

export const ContentStudio: React.FC = () => {
  const { selectedChannelId, channels } = useChannelSelection();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reselectInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const queue = useUploadQueueContext();
  const channelId = selectedChannelId ? parseInt(selectedChannelId, 10) : 0;
  const files = queue.entries.filter((entry) => entry.channelId === channelId);

  const onChooseFiles = () => fileInputRef.current?.click();

  const enqueue = (selected: File[]) => {
    if (!channelId) return;
    if (selected.length > MAX_FILES) {
      alert(`You can upload up to ${MAX_FILES} files at once`);
      return;
    }
    void queue.enqueueFiles(selected, channelId);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    enqueue(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragActive(false);
    enqueue(Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith('video/')));
  };

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const summary = summarizeEntries(files);
  const segments = summarySegments(summary);
  const isUploading = summary.uploading > 0;

  if (channels.length === 0) {
    return (
      <NoChannelView
        title="Upload Content to Your Channel"
        description="Create a channel to start uploading videos to Base.Tube and share your content with the world."
        buttonText="Create a Channel"
      />
    );
  }

  if (!selectedChannelId) {
    return (
      <Container>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Content Studio</h1>
        <div className="mt-16 flex flex-col items-center text-center">
          <FileVideo className="mb-4 h-10 w-10 text-gray-700" aria-hidden="true" />
          <h2 className="text-sm font-medium text-gray-200">No channel selected</h2>
          <p className="mt-1 text-sm text-gray-500">Pick a channel to upload to.</p>
          <Link
            to="/creator-hub/channels"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#fa7517] px-3.5 py-2
                       text-sm font-medium text-black transition-colors hover:bg-[#ff8c3a]"
          >
            Select channel
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header: the name of the place, what it does, and the two things you
          can do to the queue as a whole. */}
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Content Studio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload several videos at once — they keep going while you browse.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isUploading && (
            <button
              type="button"
              aria-label={queue.paused ? 'Resume uploads' : 'Pause uploads'}
              onClick={() => queue.setPaused(!queue.paused)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-gray-400
                         transition-colors hover:bg-white/5 hover:text-white
                         focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
            >
              {queue.paused ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pause className="h-4 w-4" aria-hidden="true" />
              )}
              {queue.paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button
            type="button"
            aria-label="Add videos"
            onClick={onChooseFiles}
            className="inline-flex items-center gap-2 rounded-md bg-[#fa7517] px-3.5 py-2 text-sm
                       font-medium text-black transition-colors hover:bg-[#ff8c3a]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add videos
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      {/* The queue can lose its file handles across a reload; reselecting the
          same file resumes it, so the affordance lives on the row. */}
      <input
        ref={reselectInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => {
          void queue.reselectFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      {segments.length > 0 && (
        <div className="mt-6">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" role="status">
            {segments.map((segment, index) => (
              <React.Fragment key={segment.key}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-700">
                    ·
                  </span>
                )}
                <span className={TONE[segment.tone]}>{segment.text}</span>
              </React.Fragment>
            ))}
          </p>
          {summary.transferComplete ? (
            <p className="mt-2 text-xs text-gray-600">All transfers complete</p>
          ) : (
            <div
              className="mt-2 h-[2px] w-full overflow-hidden bg-white/5"
              role="progressbar"
              aria-label="Overall transfer"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.transferPercent}
            >
              <div
                className="h-full bg-[#fa7517] transition-[width] duration-300 ease-out"
                style={{ width: `${summary.transferPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {queue.actionError && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-red-400" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {describeUploadError(queue.actionError.code, queue.actionError.message)}
        </p>
      )}
      {queue.selectionNotice && (
        <p className="mt-2 text-xs text-gray-500" role="status">
          {queue.selectionNotice}
        </p>
      )}
      {queue.persistenceError && (
        <p className="mt-2 text-xs text-yellow-500/80" role="status">
          {queue.persistenceError}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-800/60 overflow-hidden rounded-lg border border-gray-800/60 bg-[#0f0f0f]">
          <AnimatePresence initial={false}>
            {files.map((entry) => (
              <UploadRow
                key={entry.localId}
                entry={entry}
                onCancel={() => void queue.abortEntry(entry.localId)}
                onRetry={() => void queue.replaceAttempt(entry.localId)}
                onDismiss={() => void queue.removeEntry(entry.localId)}
                onReselect={() => reselectInputRef.current?.click()}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {files.length === 0 ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragActive(false)}
          className={`mt-8 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragActive
              ? 'border-[#fa7517] bg-[#fa7517]/[0.06]'
              : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-gray-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-gray-200">Drop videos here</p>
          <button
            type="button"
            onClick={onChooseFiles}
            className="mt-1 rounded text-sm text-[#fa7517] underline-offset-4 transition-colors
                       hover:text-[#ff8c3a] hover:underline focus-visible:outline-none
                       focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
          >
            or browse
          </button>
          <p className="mt-4 text-xs text-gray-600">
            MP4, MOV or AVI · up to 2 GB each · up to {MAX_FILES} at a time
          </p>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragActive(false)}
          className={`mt-2 rounded-lg border border-dashed px-4 py-3 text-center transition-colors ${
            dragActive ? 'border-[#fa7517] bg-[#fa7517]/[0.06]' : 'border-gray-800'
          }`}
        >
          <button
            type="button"
            onClick={onChooseFiles}
            className="rounded text-xs text-gray-500 transition-colors hover:text-gray-300
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
          >
            Drop more videos here
          </button>
        </div>
      )}
    </Container>
  );
};

interface UploadRowProps {
  entry: UploadQueueViewEntry;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  onReselect: () => void;
}

const ROW_ACTION =
  'rounded px-1 text-xs text-gray-500 transition-colors hover:text-white ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600';

const UploadRow: React.FC<UploadRowProps> = ({
  entry,
  onCancel,
  onRetry,
  onDismiss,
  onReselect,
}) => {
  const phase = uploadPhase(entry);
  const { label, percent } = phaseParts(entry);
  const text = percent ? `${label} ${percent}` : label;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group relative flex h-14 items-center gap-3 px-4"
    >
      <FileVideo className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-sm text-gray-100" title={entry.filename}>
          {entry.filename}
        </span>
        <span className="shrink-0 text-xs text-gray-600">{formatBytes(entry.sizeBytes)}</span>
      </div>

      {/* Actions stay out of the way until you go looking for them, but they
          never leave the tab order. */}
      <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
        {phase === 'uploading' && entry.status !== 'reselect_required' && (
          <button
            type="button"
            onClick={onCancel}
            className={ROW_ACTION}
            aria-label={`Cancel ${entry.filename}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {entry.status === 'reselect_required' && (
          <button
            type="button"
            onClick={onReselect}
            className={`${ROW_ACTION} text-[#fa7517] hover:text-[#ff8c3a]`}
            aria-label={`Reselect ${entry.filename}`}
          >
            Reselect
          </button>
        )}
        {phase === 'failed' && entry.videoId === null && (
          <button
            type="button"
            onClick={onRetry}
            className={`${ROW_ACTION} text-[#fa7517] hover:text-[#ff8c3a]`}
            aria-label={`Try ${entry.filename} again`}
          >
            Try again
          </button>
        )}
        {phase === 'ready' && entry.videoId !== null && (
          <>
            <Link
              to={`/video/${entry.videoId}`}
              className={`${ROW_ACTION} text-[#fa7517] hover:text-[#ff8c3a]`}
              aria-label={`View ${entry.filename}`}
            >
              View
            </Link>
            <Link
              to="/creator-hub/videos"
              className={ROW_ACTION}
              aria-label={`Edit ${entry.filename}`}
            >
              Edit
            </Link>
          </>
        )}
        {/* Once the video exists the backend owns the retry — it lives in
            Videos Management, not here. */}
        {phase === 'failed' && entry.videoId !== null && (
          <Link
            to="/creator-hub/videos"
            className={ROW_ACTION}
            aria-label={`Edit ${entry.filename}`}
          >
            Edit
          </Link>
        )}
        {(phase === 'ready' || phase === 'failed') && (
          <button
            type="button"
            onClick={onDismiss}
            className={ROW_ACTION}
            aria-label={`Dismiss ${entry.filename}`}
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {phase === 'ready' && <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />}
        {phase === 'failed' && <X className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />}
        {/* The cross-fade is keyed on the LABEL only. The percentage used to be
            part of the key, which remounted (and faded) the text on every
            progress tick — a constant orange blink for the whole upload. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`max-w-[16rem] truncate text-xs ${
              phase === 'ready'
                ? 'text-green-500'
                : phase === 'failed'
                  ? 'text-red-400'
                  : phase === 'uploading'
                    ? 'text-[#fa7517]'
                    : 'text-gray-500'
            }`}
            title={text}
          >
            {label}
          </motion.span>
        </AnimatePresence>
        {percent !== null && (
          <span className="w-10 text-right text-xs tabular-nums text-[#fa7517]">{percent}</span>
        )}
      </div>

      {/* Progress is a hairline at the foot of the row, not a chart. Processing
          has no honest percentage, so it pulses instead of claiming one. */}
      {phase === 'uploading' && (
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
      {phase === 'processing' && (
        <div
          className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5"
          role="progressbar"
          aria-label={`Processing ${entry.filename}`}
          aria-valuetext="Processing"
        >
          <div className="h-full w-full animate-pulse bg-gray-500/60 motion-reduce:animate-none" />
        </div>
      )}
    </motion.li>
  );
};

export default ContentStudio;
