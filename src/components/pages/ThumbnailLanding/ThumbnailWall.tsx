import React from 'react';
import ThumbnailArt from './ThumbnailArt';
import { EXAMPLE_THUMBNAILS } from './landingContent';

function rotate<T>(list: readonly T[], by: number): T[] {
  return [...list.slice(by), ...list.slice(0, by)];
}

/**
 * The wall of thumbnails drifting on a tilted plane (behind the AI Thumbnails sign-in, sign-up and continue pages).
 * Each row is its set twice so the loop is seamless; decorative, hidden from screen readers.
 */
const ThumbnailWall: React.FC<{ rows?: number; lazy?: boolean; className?: string }> = ({ rows = 4, lazy = false, className = '' }) => {
  const lines: string[][] = Array.from({ length: rows }, (_, row) => rotate(EXAMPLE_THUMBNAILS, (row * 5) % EXAMPLE_THUMBNAILS.length));
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="lp-wall-plane absolute inset-x-[-20%] top-[-10%] flex flex-col gap-4">
        {lines.map((line, row) => (
          <div
            key={row}
            className={`lp-drift ${row % 2 ? 'lp-reverse' : ''}`}
            style={{ ['--lp-drift' as string]: `${110 + row * 18}s` }}
          >
            {[...line, ...line].map((src, index) => (
              <ThumbnailArt key={`${row}-${index}`} src={src} lazy={lazy} className="mr-4 w-[300px] shrink-0 rounded-xl ring-1 ring-white/10 sm:w-[340px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailWall;
