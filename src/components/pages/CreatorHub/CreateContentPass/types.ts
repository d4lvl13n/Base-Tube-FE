import { CreatePassRequest } from '../../../../types/pass';

// Form values type for React Hook Form's useFieldArray compatibility
export interface FormData {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  tier?: string;
  supply_cap?: number;
  // Updated to include title for each video URL
  src_urls: { 
    value: string;
    title?: string; 
    duration?: number;
  }[];
  // Add the raw price field used in the form input if needed for direct access,
  // although validation still happens on price_cents.
  // price?: number; // Optional: if you want to explicitly type the dollar input field
}

/**
 * Transforms form data to the API request format
 * @param formData Form data with src_urls array of objects
 * @returns API-compatible CreatePassRequest with either src_url or videos
 */
export function transformFormToApiFormat(formData: FormData): CreatePassRequest {
  // Filter and validate URLs
  const validVideos = formData.src_urls
    .filter(item => item.value?.trim()?.length > 0 && 
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(item.value))
    .map(item => ({
      src_url: item.value,
      title: item.title,
      duration: item.duration
    }));
  
  // Create base request object without video fields
  const baseRequest: Omit<CreatePassRequest, 'src_url' | 'videos'> = {
    title: formData.title,
    description: formData.description,
    price_cents: formData.price_cents,
    currency: formData.currency,
    tier: formData.tier,
    supply_cap: formData.supply_cap
  };
  
  // Add videos based on count
  if (validVideos.length === 1) {
    // For a single video, you can still use src_url or switch to videos array
    return {
      ...baseRequest,
      src_url: validVideos[0].src_url,
      // Optionally include the video as a structured object in the videos array too
      videos: [validVideos[0]]
    };
  } else {
    // For multiple videos, use videos array
    return {
      ...baseRequest,
      videos: validVideos
    };
  }
} 