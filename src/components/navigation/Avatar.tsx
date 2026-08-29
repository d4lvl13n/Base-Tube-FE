import React, { useEffect, useState } from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  /**
   * Draw the initial on the fallback tile. Off in the collapsed rail, which
   * renders no text at all — a stray capital letter is still a word to read.
   */
  showInitial?: boolean;
}

/**
 * A square of colour with an initial, or the picture if it loads.
 *
 * `alt` is deliberately empty: a broken avatar next to the name it belongs to
 * should be a neutral tile, not the words "test channel cover" laid over the
 * title.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 24,
  className = '',
  showInitial = true,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.42)) };

  if (!src || failed) {
    return (
      <span
        data-testid="avatar-fallback"
        aria-hidden="true"
        style={style}
        className={`grid shrink-0 place-items-center rounded-md bg-gradient-to-br
                    from-gray-700 to-gray-900 font-medium text-gray-300 ${className}`}
      >
        {showInitial ? initial : null}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      style={style}
      className={`shrink-0 rounded-md object-cover ${className}`}
    />
  );
};

export default Avatar;
