import React, { useCallback } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { styles } from './styles';

interface VisibilitySwitchProps {
  isPublic: boolean;
  /** False while the video is still transcoding — a private-only state. */
  canPublish: boolean;
  busy: boolean;
  title: string;
  onToggle: (next: boolean) => void;
}

/**
 * The one control that changes a video's visibility.
 *
 * It is a real `role="switch"`, not a pill that happens to be clickable: the
 * creator's screen reader is told "Public, on" and pressing space flips it.
 * A video that is not finished processing cannot be published, so the switch
 * is disabled with the reason rather than failing on the server.
 */
export const VisibilitySwitch: React.FC<VisibilitySwitchProps> = ({
  isPublic,
  canPublish,
  busy,
  title,
  onToggle,
}) => {
  const disabled = busy || (!canPublish && !isPublic);
  const handleClick = useCallback(() => {
    if (disabled) return;
    onToggle(!isPublic);
  }, [disabled, isPublic, onToggle]);

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      aria-label={`${title || 'Untitled'} is ${isPublic ? 'public' : 'private'}`}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-md py-1 text-xs transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={isPublic ? 'text-gray-300' : 'text-gray-500'}>
        {isPublic ? 'Public' : 'Private'}
      </span>
      {/* 34 × 18 — a switch, not a button pretending to be one. */}
      <span
        aria-hidden="true"
        className={`relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors duration-200 ${
          isPublic ? 'bg-[#fa7517]' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-[3px] h-3 w-3 rounded-full bg-white transition-all duration-200 ${
            isPublic ? 'left-[19px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );

  if (canPublish || isPublic) return control;

  return (
    <Tooltip.Root>
      {/* A disabled button swallows pointer events, so the tooltip needs a
          wrapper it can actually hear. */}
      <Tooltip.Trigger asChild>
        <span className="inline-flex">{control}</span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.tooltip} sideOffset={6}>
          Still processing — it can go public once it is ready
          <Tooltip.Arrow className="fill-[#0f0f0f]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};

export default VisibilitySwitch;
