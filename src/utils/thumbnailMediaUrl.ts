const STORJ_THUMBNAILS = 'https://gateway.storjshare.io/basetube-thumbnails/';

export function thumbnailMediaUrl(url: string): string {
  if (!url.startsWith(STORJ_THUMBNAILS)) return url;
  const objectAndQuery = url.slice(STORJ_THUMBNAILS.length);
  if (!/^[a-f0-9-]+\.(?:png|jpe?g|webp)\?/.test(objectAndQuery)) return url;
  // Preserve the signed query verbatim. The API still receives the original URL.
  return '/thumbnail-media/' + objectAndQuery;
}
