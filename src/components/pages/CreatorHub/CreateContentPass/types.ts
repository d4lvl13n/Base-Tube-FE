import { CreatePassRequest } from '../../../../types/pass';

// Form values type for React Hook Form's useFieldArray compatibility
export interface FormData {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  /** How many passes exist. Required: every pass has a cap. */
  supply_cap?: number;
  /** The most passes one person may buy (1 … supply_cap). */
  max_per_buyer?: number;
  // Updated to include title for each video URL
  src_urls: {
    value: string;
    title?: string;
    duration?: number;
    thumbnail_url?: string;
  }[];
}

const YOUTUBE_URL = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;

/** The form's video rows that hold a usable YouTube link. */
export const validVideoRows = (rows: FormData['src_urls'] | undefined): FormData['src_urls'] =>
  (rows ?? []).filter((item) => item?.value?.trim()?.length > 0 && YOUTUBE_URL.test(item.value));

/**
 * Transforms form data to the API request format
 * @param formData Form data with src_urls array of objects
 * @returns API-compatible CreatePassRequest with either src_url or videos
 */
export function transformFormToApiFormat(formData: FormData): CreatePassRequest {
  const validVideos = validVideoRows(formData.src_urls).map((item) => ({
    src_url: item.value,
    title: item.title,
    duration: item.duration,
  }));

  const baseRequest: Omit<CreatePassRequest, 'src_url' | 'videos'> = {
    title: formData.title,
    description: formData.description,
    price_cents: formData.price_cents,
    currency: formData.currency,
    supply_cap: formData.supply_cap,
    max_per_buyer: formData.max_per_buyer,
  };

  if (validVideos.length === 1) {
    return {
      ...baseRequest,
      src_url: validVideos[0].src_url,
      videos: [validVideos[0]],
    };
  }
  return {
    ...baseRequest,
    videos: validVideos,
  };
}
