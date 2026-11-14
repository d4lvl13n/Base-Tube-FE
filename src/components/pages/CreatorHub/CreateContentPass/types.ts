import { CreatePassRequest } from '../../../../types/pass';
import type { PriceTierDto } from '../../../../utils/passPricing';

/** One price (the default) or a price that rises by tiers. */
export type PricingMode = 'single' | 'tiered';

// Form values type for React Hook Form's useFieldArray compatibility
export interface FormData {
  title: string;
  description?: string;
  /** One price; with tiers, the START price (the first tier's). */
  price_cents: number;
  currency?: string;
  pricing_mode?: PricingMode;
  /** Tiers only: the final price typed into the builder. */
  final_price_cents?: number;
  /** Tiers only: how many tiers the builder makes (2–10). */
  tier_count?: number;
  /** Tiers only: the grid, built from the three entries above and editable. */
  price_tiers?: PriceTierDto[];
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

/** The form sells by a grid of two tiers or more. */
export const isTieredForm = (formData: Pick<FormData, 'pricing_mode' | 'price_tiers'>): boolean =>
  formData.pricing_mode === 'tiered' && Array.isArray(formData.price_tiers) && formData.price_tiers.length >= 2;

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

  // With tiers the grid is the price: the pass's price is its first tier's.
  const grid = isTieredForm(formData) ? formData.price_tiers! : null;
  const baseRequest: Omit<CreatePassRequest, 'src_url' | 'videos'> = {
    title: formData.title,
    description: formData.description,
    price_cents: grid ? grid[0].priceCents : formData.price_cents,
    currency: formData.currency,
    supply_cap: formData.supply_cap,
    max_per_buyer: formData.max_per_buyer,
    ...(grid ? { price_tiers: grid } : {}),
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
