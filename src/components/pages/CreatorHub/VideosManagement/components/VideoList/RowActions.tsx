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
  className?: string;
}> = ({ label, onClick, children, className }) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button type="button" aria-label={label} onClick={onClick} className={`${styles.actionButton} ${className ?? ''}`}>
        {children}
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className={styles.tooltip} sideOffset={5}>
        {label}
        <Tooltip.Arrow className="fill-gray-900" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

/**
 * The controls at the end of a row.
 *
 * They are always in the DOM — hiding them behind `:hover` alone would put
 * them out of reach of a keyboard and of every touch device — but they fade
 * back on a pointer device until the row is hovered or something inside it has
 * focus. `group-hover`/`focus-within` on the row does that in CSS, so nothing
 * here re-renders on mouse movement.
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
    <div
      className="flex items-center justify-end gap-0.5 opacity-100 transition-opacity
                 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      onClick={stop}
    >
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
            <Tooltip.Content className={styles.tooltip} sideOffset={5}>
              Watch
              <Tooltip.Arrow className="fill-gray-900" />
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
                className={`${styles.actionButton} cursor-not-allowed opacity-40`}
              >
                <Play className={styles.actionIcon} aria-hidden="true" />
              </button>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className={styles.tooltip} sideOffset={5}>
              Still processing — nothing to watch yet
              <Tooltip.Arrow className="fill-gray-900" />
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
          <DropdownMenu.Content className={styles.dropdownMenu.content} align="end" sideOffset={4}>
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
