// src/types/thumbnail.ts

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
  | 'youtube-shorts';

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
   * Rendering quality for GPT Image 2.
   * Kept for backward compatibility.
   */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /**
   * Product-approved thumbnail format.
   * - landscape: YouTube/BaseTube, resolves server-side to 1536x864
   * - short: TikTok/Shorts, resolves server-side to 1024x1792
   */
  size?: ThumbnailSizePreset;
  style?: string;
  /**
   * GPT Image 2 does not support transparent backgrounds.
   */
  background?: 'opaque' | 'auto';
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
  id: number;
  storj_key: string;
  prompt: string;
  model: string;
  quality: string;
  style: string;
  size: string;
  video_id: number | null;
  used_in_video_id: number | null;
  is_used: boolean;
  username: string;
  config: Record<string, any>;
  download_count: number;
  created_at: string;
  updated_at: string;
  thumbnailUrl: string;
  channelHandle: string;
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
