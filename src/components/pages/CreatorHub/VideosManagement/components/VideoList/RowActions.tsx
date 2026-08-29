import React, { useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Link2, MoreHorizontal, Pencil, Play, RefreshCw, Trash2 } from 'lucide-react';
import { styles } from './styles';

interface RowActionsProps {
  videoId: number;
  title: string;
  /** False while the video is still transcoding: there is nothing to watch. */
  playable: boolean;
  /** True only for a video whose transcode failed — Retry is its only news. */
  failed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onRetry?: () => void;
}

/** An icon button with the tooltip that says what it is. */
const IconAction: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button type="button" aria-label={label} onClick={onClick} className={styles.actionButton}>
        {children}
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className={styles.tooltip} sideOffset={6}>
        {label}
        <Tooltip.Arrow className="fill-[#0f0f0f]" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

/**
 * The controls at the end of a row.
 *
 * They are always in the DOM — hiding them behind `:hover` alone would put
 * them out of reach of a keyboard and of every touch device — but on a pointer
 * device they fade back until the row is hovered or something inside it has
 * focus. That is `styles.revealed` on the row's `group`, so nothing here
 * re-renders on mouse movement.
 */
export const RowActions: React.FC<RowActionsProps> = ({
  videoId,
  title,
  playable,
  failed,
  onEdit,
  onDelete,
  onCopyLink,
  onRetry,
}) => {
  const stop = useCallback((event: React.MouseEvent) => event.stopPropagation(), []);

  return (
    <div className="flex items-center justify-end gap-0.5" onClick={stop}>
      {playable ? (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <a
              href={`/video/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${title || 'video'}`}
              className={styles.actionButton}
            >
              <Play className={styles.actionIcon} aria-hidden="true" />
            </a>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className={styles.tooltip} sideOffset={6}>
              Watch
              <Tooltip.Arrow className="fill-[#0f0f0f]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      ) : (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="inline-flex">
              <button
                type="button"
                disabled
                aria-label={`Watch ${title || 'video'}`}
                className={styles.actionButton}
              >
                <Play className={styles.actionIcon} aria-hidden="true" />
              </button>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className={styles.tooltip} sideOffset={6}>
              Still processing — nothing to watch yet
              <Tooltip.Arrow className="fill-[#0f0f0f]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}

      <IconAction label="Copy link" onClick={onCopyLink}>
        <Link2 className={styles.actionIcon} aria-hidden="true" />
      </IconAction>

      <IconAction label="Edit video" onClick={onEdit}>
        <Pencil className={styles.actionIcon} aria-hidden="true" />
      </IconAction>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" aria-label="More actions" className={styles.actionButton}>
            <MoreHorizontal className={styles.actionIcon} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.dropdownMenu.content} align="end" sideOffset={6}>
            {failed && onRetry && (
              <DropdownMenu.Item className={styles.dropdownMenu.item} onSelect={onRetry}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry processing
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item className={styles.dropdownMenu.dangerItem} onSelect={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete…
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default RowActions;
