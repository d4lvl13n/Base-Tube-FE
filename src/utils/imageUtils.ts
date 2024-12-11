// src/utils/imageUtils.ts
export const processImageUrl = (url: string | null | undefined, defaultImage: string): string => {
  if (!url) return defaultImage;
  return url.startsWith('http') 
    ? url 
    : `${process.env.REACT_APP_API_URL}/${url}`;
};