import { useEffect, useState } from 'react';

/**
 * A still frame of a local video file, for its tile (the AmazingAerial
 * `useIntakeVideoPoster` idea). Decoded once per file, a second in (or at the
 * start of a shorter clip); null when the browser cannot decode the format —
 * the tile then keeps its placeholder.
 */
export function useVideoPoster(file: File | null): string | null {
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPoster(null);
      return undefined;
    }
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    };
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 0) / 4);
    };
    video.onseeked = () => {
      if (cancelled) return;
      const width = 480;
      const height = Math.round((video.videoHeight / Math.max(1, video.videoWidth)) * width) || 270;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!cancelled && blob) setPoster(URL.createObjectURL(blob));
          cleanup();
        },
        'image/jpeg',
        0.8,
      );
    };
    video.onerror = cleanup;

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [file]);

  // The poster's own object URL is released when it is replaced or unmounted.
  useEffect(
    () => () => {
      if (poster) URL.revokeObjectURL(poster);
    },
    [poster],
  );

  return poster;
}
