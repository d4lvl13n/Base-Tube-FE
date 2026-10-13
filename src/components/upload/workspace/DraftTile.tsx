import React from 'react';
import { Check } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { formatBytes } from '../uploadPhase';
import { displayTitle, isPublished, technicalChip, type TechnicalState } from './draftStatus';
import { useVideoPoster } from './useVideoPoster';
import { workspaceCopy } from './workspaceCopy';

interface DraftTileProps {
  draft: WorkspaceDraft;
  technical: TechnicalState;
  selected: boolean;
  ready: boolean;
  thumbnailUrl: string | null;
  /** A text action under the tile when the file needs the creator (AA `ig-retry`). */
  inlineAction: { label: string; onClick: () => void } | null;
  onOpen: () => void;
  tileRef: (node: HTMLButtonElement | null) => void;
}

/**
 * One video of the grid (AmazingAerial `ig-card`, 16:9 for video).
 *
 * The preview fills the tile; a small chip on it says where the file stands,
 * a check replaces the chip once playback is ready. Under it: the title and
 * the size. Clicking opens the inspector for this video only.
 */
const DraftTile: React.FC<DraftTileProps> = ({
  draft,
  technical,
  selected,
  ready,
  thumbnailUrl,
  inlineAction,
  onOpen,
  tileRef,
}) => {
  const poster = useVideoPoster(thumbnailUrl ? null : (draft.entry?.file ?? null));
  const image = thumbnailUrl ?? poster;
  const chip = technicalChip(technical);
  const published = isPublished(draft);
  const title = displayTitle(draft);
  const size = draft.entry ? formatBytes(draft.entry.sizeBytes) : null;
  const editorial = published ? workspaceCopy.published : ready ? workspaceCopy.readyToPublish : null;

  return (
    <article
      className="relative min-w-0 overflow-hidden rounded-lg bg-[#0f0f0f] transition-shadow"
      style={{
        boxShadow: selected ? '0 0 0 2px #fa7517' : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      <button
        type="button"
        ref={tileRef}
        onClick={onOpen}
        aria-pressed={selected}
        aria-label={`${title}${chip ? `, ${chip}` : `, ${workspaceCopy.playbackReady}`}`}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fa7517]"
      >
        <span className="relative block aspect-video overflow-hidden bg-[#080809]">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" decoding="async" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 motion-safe:animate-pulse">
                Video
              </span>
            </span>
          )}

          {chip ? (
            <span
              role="status"
              className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                technical.tone === 'attention'
                  ? 'bg-yellow-400 text-black'
                  : technical.tone === 'active'
                    ? 'bg-black/75 text-white'
                    : 'bg-black/75 text-gray-200'
              }`}
            >
              {chip}
            </span>
          ) : (
            <span
              role="status"
              title={workspaceCopy.playbackReady}
              className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-black"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{workspaceCopy.playbackReady}</span>
            </span>
          )}

          {technical.percent !== null && (
            <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40" aria-hidden="true">
              <span
                className="block h-full bg-[#fa7517] transition-[width] duration-300 ease-out"
                style={{ width: `${technical.percent}%` }}
              />
            </span>
          )}
        </span>

        <span className="block px-2.5 pb-2.5 pt-2">
          <span className="block truncate text-[13px] font-medium text-gray-100" title={title}>
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-gray-500">
            {[size, editorial].filter(Boolean).join(' · ') || ' '}
          </span>
        </span>
      </button>

      {inlineAction && (
        <button
          type="button"
          onClick={inlineAction.onClick}
          className="mx-2.5 mb-2.5 -mt-1 min-h-[32px] text-[12px] font-medium text-[#fa7517] hover:text-[#ff8c3a]
                     focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          {inlineAction.label}
        </button>
      )}
    </article>
  );
};

export default DraftTile;
