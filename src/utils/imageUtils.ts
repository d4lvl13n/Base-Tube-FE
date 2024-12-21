// src/utils/imageUtils.ts
export const processImageUrl = (url: string | null | undefined, defaultImage: string): string => {
  if (!url) return defaultImage;
  
  // If it's a Storj URL (contains storjshare.io), return it directly
  if (url.includes('storjshare.io')) {
    return url;
  }
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) {
    return url;
  }
  
  // Otherwise, prepend the API URL
  return `${process.env.REACT_APP_API_URL}/${url}`;
};