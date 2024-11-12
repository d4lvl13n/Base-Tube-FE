export const formatDuration = (seconds?: number): string => {
  // Handle invalid or missing duration
  if (!seconds || isNaN(seconds)) return '--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatNumber = (num?: number | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } 
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } 
  
  return num.toString();
};