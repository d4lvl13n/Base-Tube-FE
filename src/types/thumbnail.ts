import type { OverlayTextPlan } from './ctr';
export interface ThumbnailBrief { title: string; description?: string; creatorHook?: string; }
export interface ThumbnailTextStyle { font: 'DejaVu Sans' | 'DejaVu Serif' | 'DejaVu Sans Mono'; color: string; fontScale: number; stroke: boolean; }
export interface ThumbnailEditing { baseThumbnailId: number; baseImageUrl: string; textPlan: OverlayTextPlan; textStyle: ThumbnailTextStyle; }

// src/types/thumbnail.ts

export type ThumbnailImageModel = 'gpt-image-2' | 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst' | 'gemini-3-pro';
export type ThumbnailQuality = 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'auto';

export type ThumbnailOutputFormat = 'landscape' | 'short';

export type ThumbnailSizePreset =
  | ThumbnailOutputFormat
  | 'youtube'
  | 'platform'
  | 'basetube'
  | 'base-tube'
  | 'shorts'
  | 'tiktok'
  | 'tiktok-short'
  | 'youtube-short'
  | 'youtube-shorts'
  | `${number}x${number}`;

export const THUMBNAIL_OUTPUT_FORMATS: Record<ThumbnailOutputFormat, {
  label: string;
  description: string;
  size: '1536x864' | '1024x1792';
  platforms: string;
}> = {
  landscape: {
    label: 'YouTube / BaseTube',
    description: 'Landscape thumbnail for long-form videos',
    size: '1536x864',
    platforms: 'YouTube, BaseTube',
  },
  short: {
    label: 'Shorts / TikTok',
    description: 'Vertical thumbnail for short-form feeds',
    size: '1024x1792',
    platforms: 'TikTok, Shorts',
  },
};

export interface ThumbnailGenerationOptions {
  creatorBrief?: ThumbnailBrief;
  distinctConcepts?: boolean;
  referenceRole?: 'subject' | 'style';
  n?: number;
  model?: ThumbnailImageModel;
  outputFormat?: 'png' | 'jpeg' | 'webp';
  outputCompression?: number;
  customPrompt?: string;
  /**
   * @deprecated Use size instead.
   * Kept for backward compatibility.
   */
  width?: number;
  /**
   * @deprecated Use size instead.
   * Kept for backward compatibility.
   */
  height?: number;
  /**
   * Rendering quality for GPT Image 2.5.
   * Kept for backward compatibility.
   */
  quality?: ThumbnailQuality;
  /**
   * Thumbnail preset or validated WIDTHxHEIGHT dimensions.
   * - landscape: YouTube/BaseTube, resolves server-side to 1536x864
   * - short: TikTok/Shorts, resolves server-side to 1024x1792
   */
  size?: ThumbnailSizePreset;
  style?: string;
  /**
   * Transparent output requires PNG or WebP.
   */
  background?: 'opaque' | 'auto' | 'transparent';
}

export interface ThumbnailGenerationResponse {
  success: boolean;
  data: {
    thumbnailUrl: string;
    prompt: string;
  };
}

export interface CustomThumbnailGenerationOptions extends ThumbnailGenerationOptions {
  prompt: string;
}

export interface CustomThumbnailGenerationResponse {
  success: boolean;
  data: {
    thumbnailUrl: string;
    thumbnailPath: string;
    prompt: string;
  };
}

export interface ThumbnailWithReferenceOptions extends ThumbnailGenerationOptions {
  referenceImage: File;
  videoId?: number;
  customPrompt?: string;
  referenceImageDetail?: 'low' | 'high' | 'auto';
  // Async mode and generation tuning
  async?: boolean;
  n?: number; // 1–10
}

export interface ThumbnailWithReferenceResponse {
  success: boolean;
  data: {
    // Single result
    thumbnailUrl?: string;
    thumbnailPath?: string;
    prompt?: string;
    // Multiple results
    thumbnails?: Array<{
      thumbnailUrl: string;
      thumbnailPath?: string;
    }>;
  };
}

export interface ThumbnailConversationState {
  responseId: string;
  imageGenerationCallId: string;
  revisedPrompt?: string;
}

export interface ThumbnailRefinementOptions extends ThumbnailGenerationOptions {
  instruction: string;
  thumbnailId?: string | number;
  imageUrl?: string;
  image?: File;
  previousResponseId?: string;
  imageGenerationCallId?: string;
}

export interface ThumbnailRefinementResponse {
  success: boolean;
  data: {
    id?: number;
    thumbnailUrl: string;
    shareUrl?: string;
    conversation: ThumbnailConversationState;
  };
}

// Thumbnail Gallery Types

/**
 * Individual thumbnail item as returned by the API
 */
export interface ThumbnailItem {
  conceptName?: string;
  conceptDescription?: string;
  /** Public short_id (string), not the numeric DB id */
  id: string;
  model: string;
  quality: string;
  style: string;
  size: string;
  isUsed: boolean;
  downloadCount: number;
  createdAt: string;
  thumbnailUrl: string | null;
  channelHandle: string | null;
  /** Only returned by the single-item endpoint, never by the public gallery list */
  username?: string | null;
  usedInVideoId?: number | null;
  /** Not exposed by the public gallery (other creators' prompts stay private) */
  prompt?: string;
}

/**
 * Parameters for filtering and paginating the thumbnail gallery
 */
export interface ThumbnailGalleryParams {
  search?: string;
  videoId?: number;
  used?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Response from the thumbnail gallery API
 */
export interface ThumbnailGalleryResponse {
  count: number;
  thumbnails: ThumbnailItem[];
  limit: number;
  offset: number;
  hasMore: boolean;
}
