const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;
const EMBEDDED_URL_PATTERN = /^(data|blob):/i;

export const resolveThumbnailImageUrl = (url: string | null | undefined): string => {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return '';

  if (ABSOLUTE_URL_PATTERN.test(trimmedUrl) || EMBEDDED_URL_PATTERN.test(trimmedUrl)) {
    return trimmedUrl;
  }

  const apiBaseUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, '');

  if (trimmedUrl.startsWith('/')) {
    return apiBaseUrl ? `${apiBaseUrl}${trimmedUrl}` : trimmedUrl;
  }

  return apiBaseUrl ? `${apiBaseUrl}/${trimmedUrl}` : `/${trimmedUrl}`;
};
