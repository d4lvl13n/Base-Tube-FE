export type EmbedSize = {
  width: number;
  height: number;
  label: string;
};

export type EmbedSizes = {
  SMALL: EmbedSize;
  MEDIUM: EmbedSize;
  LARGE: EmbedSize;
  HD: EmbedSize;
};

export const EMBED_SIZES = {
  SMALL: { width: 560, height: 315, label: 'Small (560x315)' },
  MEDIUM: { width: 640, height: 360, label: 'Medium (640x360)' },
  LARGE: { width: 853, height: 480, label: 'Large (853x480)' },
  HD: { width: 1280, height: 720, label: 'HD (1280x720)' }
} as const;

export const generateEmbedCode = (
  videoId: string,
  videoTitle: string,
  size: EmbedSize = EMBED_SIZES.SMALL
): string => {
  // Construct the embed URL based on the current domain and videoId
  const embedSrc = `https://beta.base.tube/embed/${videoId}`;
  return `<iframe 
    src="${embedSrc}" 
    width="${size.width}" 
    height="${size.height}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen
    loading="lazy"
    title="${videoTitle}"
    sandbox="allow-scripts allow-same-origin allow-presentation"
  ></iframe>`;
}; 