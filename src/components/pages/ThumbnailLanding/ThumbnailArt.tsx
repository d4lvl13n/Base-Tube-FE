import React from 'react';

type Place = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const PLACE: Record<Place, string> = {
  'top-left': 'left-[5%] top-[7%] text-left',
  'top-right': 'right-[5%] top-[7%] text-right',
  'bottom-left': 'bottom-[8%] left-[5%] text-left',
  'bottom-right': 'bottom-[8%] right-[5%] text-right',
};

/** A 16:9 thumbnail: the picture, and its title set in type on top the way creators print it. */
const ThumbnailArt: React.FC<{
  src: string;
  title: string;
  place: Place;
  tone: 'yellow' | 'white';
  alt?: string;
  className?: string;
  /** Below the fold: let the browser load it late. */
  lazy?: boolean;
}> = ({ src, title, place, tone, alt = '', className = '', lazy = false }) => (
  <div className={`lp-thumb relative aspect-video overflow-hidden bg-zinc-900 ${className}`}>
    <img src={src} alt={alt} loading={lazy ? 'lazy' : 'eager'} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
    <span aria-hidden="true" className={`lp-thumb-title absolute max-w-[62%] ${PLACE[place]} ${tone === 'yellow' ? 'text-[#ffe14d]' : 'text-white'}`}>
      {title}
    </span>
  </div>
);

export default ThumbnailArt;
