import React, { useRef } from 'react';
import { AlertCircle, ImageIcon, Loader2, Sparkles, Upload, Wand2 } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { workspaceCopy } from './workspaceCopy';

interface ThumbnailPickerProps {
  draft: WorkspaceDraft;
  previewUrl: string | null;
  onImport: (file: File) => void;
  onAutomatic: () => void;
  onOpenAi: () => void;
  onRetry: () => void;
  /** A one-off sentence from the last choice (a refused file, a browser that will not keep it). */
  notice: string | null;
  /** Image above the choices (small screens) rather than beside them. */
  stacked: boolean;
}

const SEGMENT =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 text-sm transition-colors ' +
  'focus-visible:relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';

/**
 * Three choices (UP-UX §8): the automatic poster, an image from disk, or the
 * existing AI tool. The selected segment already says which one is in use, so
 * a status line appears only while saving, or when something went wrong. A
 * choice is never shown as saved on the strength of a local preview.
 */
const ThumbnailPicker: React.FC<ThumbnailPickerProps> = ({
  draft,
  previewUrl,
  onImport,
  onAutomatic,
  onOpenAi,
  onRetry,
  notice,
  stacked,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const choice = draft.record.thumbnail;
  const server = draft.record.server;
  const current: 'automatic' | 'import' | 'ai' = choice
    ? choice.kind === 'automatic'
      ? 'automatic'
      : choice.source === 'ai'
        ? 'ai'
        : 'import'
    : server?.thumbnail.source === 'custom'
      ? 'import'
      : 'automatic';
  const saving = !!choice && ['pending_upload', 'uploading', 'uploaded', 'selecting'].includes(choice.status);

  const segments: Array<{ id: typeof current; label: string; icon: React.ReactNode; onClick: () => void }> = [
    { id: 'automatic', label: workspaceCopy.thumbnailAutomatic, icon: <Wand2 className="h-4 w-4" aria-hidden="true" />, onClick: onAutomatic },
    {
      id: 'import',
      label: workspaceCopy.thumbnailImport,
      icon: <Upload className="h-4 w-4" aria-hidden="true" />,
      onClick: () => inputRef.current?.click(),
    },
    { id: 'ai', label: workspaceCopy.thumbnailAi, icon: <Sparkles className="h-4 w-4" aria-hidden="true" />, onClick: onOpenAi },
  ];

  return (
    <div>
      <span className="block text-xs font-medium text-gray-400" id={`thumbnail-${draft.key}`}>
        {workspaceCopy.thumbnail}
      </span>
      <div
        className="mt-1.5 flex gap-3"
        style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center' }}
      >
        <div
          className="relative aspect-video shrink-0 overflow-hidden rounded-md bg-black ring-1 ring-gray-800"
          style={{ width: stacked ? '100%' : '8.5rem' }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Selected thumbnail" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
            </span>
          )}
          {saving && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300 motion-reduce:animate-none" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            aria-labelledby={`thumbnail-${draft.key}`}
            className="flex divide-x divide-gray-800 overflow-hidden rounded-md border border-gray-800"
          >
            {segments.map((segment) => {
              const active = current === segment.id;
              return (
                <button
                  key={segment.id}
                  type="button"
                  aria-pressed={active}
                  onClick={segment.onClick}
                  className={`${SEGMENT} ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : segment.id === 'ai'
                        ? 'text-[#fa7517] hover:bg-[#fa7517]/[0.08]'
                        : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {segment.icon}
                  {segment.label}
                </button>
              );
            })}
          </div>

          <div aria-live="polite">
            {saving && (
              <p className="mt-2 text-xs text-gray-400">
                {choice?.kind === 'automatic' ? workspaceCopy.thumbnailAutomaticPending : workspaceCopy.thumbnailUploading}
              </p>
            )}
            {choice?.status === 'failed' && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-yellow-300" role="alert">
                <span className="inline-flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {workspaceCopy.thumbnailFailed} {choice.errorMessage}
                </span>
                {choice.errorCode !== 'THUMBNAIL_FILE_MISSING' && (
                  <button type="button" onClick={onRetry} className="min-h-[44px] text-[#fa7517] hover:text-[#ff8c3a]">
                    {workspaceCopy.retry}
                  </button>
                )}
                <button type="button" onClick={onAutomatic} className="min-h-[44px] text-gray-300 hover:text-white">
                  {workspaceCopy.thumbnailUseAutomatic}
                </button>
              </div>
            )}
            {choice && !choice.blobPersisted && choice.status !== 'selected' && (
              <p className="mt-2 text-xs text-yellow-500/80">{workspaceCopy.thumbnailNotKept}</p>
            )}
            {notice && <p className="mt-2 text-xs text-yellow-500/80">{notice}</p>}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = '';
        }}
      />
    </div>
  );
};

export default ThumbnailPicker;
