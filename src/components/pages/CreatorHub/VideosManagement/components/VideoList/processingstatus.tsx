import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProcessingVideo } from '../../../../../../hooks/useVideoProcessing';

/**
 * The same three words Content Studio uses — Processing, Ready, Failed.
 *
 * A creator who watched a file upload in Content Studio and then walked over to
 * Videos Management used to be met with a different vocabulary and a percentage
 * bar that measured one rendition out of several. The percentage was never the
 * whole truth, so it is gone: what the transcoder is *doing* is the honest
 * thing to say, and a pulsing hairline says "still working" without pretending
 * to know how far along it is.
 */
export type VideoPhase = 'processing' | 'ready' | 'failed';

/** How long the green check lingers before the row goes back to normal. */
const READY_HOLD_MS = 2_400;

export function videoPhase(row: ProcessingVideo): VideoPhase {
  if (row.status === 'failed') return 'failed';
  if (row.status === 'processed' || row.status === 'completed') return 'ready';
  return 'processing';
}

/**
 * What the transcoder is doing right now, read off the rendition states.
 *
 * No renditions means the server has not decided what to make yet — that is
 * `inspecting`, not transcoding. A passthrough video (browser-compatible
 * original, nothing to transcode) therefore never claims to be transcoding on
 * its way to `Ready`.
 */
export function renditionDetail(row: ProcessingVideo): string {
  const renditions = row.renditions ?? [];
  if (renditions.length === 0) return 'inspecting';
  const active = renditions.find((rendition) => rendition.state === 'in_progress');
  if (active) return `transcoding ${active.quality}`;
  const done = renditions.filter((rendition) => rendition.state === 'verified').length;
  if (done > 0) return `transcoded ${done}/${renditions.length}`;
  return 'queued for transcoding';
}

/** The one line the row shows: `Label` or `Label · detail`. */
export function phaseText(row: ProcessingVideo): string {
  switch (videoPhase(row)) {
    case 'ready':
      return 'Ready';
    case 'failed':
      return `Failed · ${row.error?.message?.trim() || 'processing failed'}`;
    default:
      return `Processing · ${renditionDetail(row)}`;
  }
}

interface ProcessingStatusProps {
  videoId: number;
  processingStatus?: ProcessingVideo;
  onRetry?: () => Promise<void>;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  videoId,
  processingStatus,
  onRetry,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [readyElapsed, setReadyElapsed] = useState(false);

  const phase = processingStatus ? videoPhase(processingStatus) : null;

  // `Ready` is an acknowledgement, not a state: it fades in once and then the
  // row is just a row again.
  useEffect(() => {
    if (phase !== 'ready') {
      setReadyElapsed(false);
      return;
    }
    const timer = setTimeout(() => setReadyElapsed(true), READY_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!processingStatus || phase === null) return null;
  if (phase === 'ready' && readyElapsed) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const text = phaseText(processingStatus);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col gap-1"
      data-testid={`processing-status-${videoId}`}
    >
      <div className="flex items-center gap-1.5">
        {phase === 'ready' && (
          <Check className="h-3.5 w-3.5 shrink-0 text-green-500" aria-hidden="true" />
        )}
        {phase === 'failed' && (
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
        )}
        <span
          className={`truncate text-xs ${
            phase === 'ready'
              ? 'text-green-500'
              : phase === 'failed'
                ? 'text-red-400'
                : 'text-gray-500'
          }`}
          title={text}
        >
          {text}
        </span>
        {phase === 'failed' && onRetry && (
          <motion.button
            type="button"
            className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
              isRetrying
                ? 'cursor-not-allowed text-gray-500'
                : 'text-[#fa7517] hover:text-[#ff8c3a]'
            }`}
            whileHover={!isRetrying ? { scale: 1.05 } : undefined}
            whileTap={!isRetrying ? { scale: 0.95 } : undefined}
            onClick={handleRetry}
            disabled={isRetrying}
            aria-label="Retry processing"
          >
            {isRetrying ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              'Retry'
            )}
          </motion.button>
        )}
      </div>

      {/* Processing has no honest percentage, so the hairline pulses instead of
          claiming one. */}
      {phase === 'processing' && (
        <div
          className="h-[2px] w-full max-w-[16rem] overflow-hidden bg-white/5"
          role="progressbar"
          aria-label="Processing"
          aria-valuetext="Processing"
        >
          <div className="h-full w-full animate-pulse bg-gray-500/60 motion-reduce:animate-none" />
        </div>
      )}
    </motion.div>
  );
};

export default ProcessingStatus;
