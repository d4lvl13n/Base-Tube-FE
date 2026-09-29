import React from 'react';

/** A 16:9 thumbnail made with AI Thumbnails: its headline is part of the image. */
const ThumbnailArt: React.FC<{
  src: string;
  alt?: string;
  className?: string;
  /** Below the fold: let the browser load it late. */
  lazy?: boolean;
}> = ({ src, alt = '', className = '', lazy = false }) => (
  <div className={`relative aspect-video overflow-hidden bg-zinc-900 ${className}`}>
    <img src={src} alt={alt} loading={lazy ? 'lazy' : 'eager'} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
  </div>
);

export default ThumbnailArt;
