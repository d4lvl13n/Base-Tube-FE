import React, { useRef } from 'react';
import { AlertCircle, Check, ImageIcon, Loader2, Sparkles, Upload, Wand2 } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { workspaceCopy } from './workspaceCopy';

const CHOICE =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-md border px-3 text-xs transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';

interface ThumbnailPickerProps {
  draft: WorkspaceDraft;
  previewUrl: string | null;
  onImport: (file: File) => void;
  onAutomatic: () => void;
  onOpenAi: () => void;
  onRetry: () => void;
  /** A one-off sentence from the last choice (a refused file, a browser that will not keep it). */
  notice: string | null;
}

/**
 * Three choices next to the title (UP-UX §8): the automatic poster, an image
 * from disk, or the existing AI tool. A choice reads "saved" only once the
 * server has selected it — never on the strength of a local preview.
 */
const ThumbnailPicker: React.FC<ThumbnailPickerProps> = ({
  draft,
  previewUrl,
  onImport,
  onAutomatic,
  onOpenAi,
  onRetry,
  notice,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const choice = draft.record.thumbnail;
  const server = draft.record.server;
  const automaticActive = choice ? choice.kind === 'automatic' : (server?.thumbnail.source ?? 'automatic') === 'automatic';
  const saving = !!choice && ['pending_upload', 'uploading', 'uploaded', 'selecting'].includes(choice.status);

  let status: React.ReactNode;
  if (choice?.status === 'failed') {
    status = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-yellow-400" role="alert">
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
    );
  } else if (saving) {
    status = (
      <p className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {choice?.kind === 'automatic' ? workspaceCopy.thumbnailAutomaticPending : workspaceCopy.thumbnailUploading}
      </p>
    );
  } else if (choice?.status === 'selected' || server) {
    const custom = choice ? choice.kind === 'custom' : server?.thumbnail.source === 'custom';
    status = (
      <p className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
        {custom ? workspaceCopy.thumbnailCustomSaved : workspaceCopy.thumbnailAutomaticActive}
      </p>
    );
  } else {
    status = <p className="text-xs text-gray-600">{workspaceCopy.thumbnailNote}</p>;
  }

  return (
    <div>
      <span className="block text-xs font-medium text-gray-400" id={`thumbnail-${draft.key}`}>
        {workspaceCopy.thumbnail}
      </span>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded border border-gray-800 bg-black sm:w-40">
          {previewUrl ? (
            <img src={previewUrl} alt="Selected thumbnail" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1">
              <ImageIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
              <span className="text-[11px] text-gray-600">
                {automaticActive ? workspaceCopy.automaticThumbnailPlaceholder : workspaceCopy.customThumbnailPlaceholder}
              </span>
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div role="group" aria-labelledby={`thumbnail-${draft.key}`} className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={automaticActive}
              onClick={onAutomatic}
              className={`${CHOICE} ${automaticActive ? 'border-[#fa7517]/60 text-white' : 'border-gray-800 text-gray-400 hover:text-white'}`}
            >
              <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
              {workspaceCopy.thumbnailAutomatic}
            </button>
            <button
              type="button"
              aria-pressed={choice?.kind === 'custom' && choice.source === 'import'}
              onClick={() => inputRef.current?.click()}
              className={`${CHOICE} border-gray-800 text-gray-400 hover:text-white`}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {workspaceCopy.thumbnailImport}
            </button>
            <button
              type="button"
              aria-pressed={choice?.kind === 'custom' && choice.source === 'ai'}
              onClick={onOpenAi}
              className={`${CHOICE} border-gray-800 text-[#fa7517] hover:text-[#ff8c3a]`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {workspaceCopy.thumbnailAi}
            </button>
          </div>
          <div className="mt-2" aria-live="polite">
            {status}
          </div>
          {choice && !choice.blobPersisted && choice.status !== 'selected' && (
            <p className="mt-1 text-xs text-yellow-500/80">{workspaceCopy.thumbnailNotKept}</p>
          )}
          {notice && <p className="mt-1 text-xs text-yellow-500/80">{notice}</p>}
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
