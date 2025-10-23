// src/types/thumbnail.ts

export interface ThumbnailGenerationOptions {
  customPrompt?: string;
  /**
   * @deprecated No longer used. All thumbnails are now generated at 1280x720 resolution. 
   * Kept for backward compatibility.
   */
  width?: number;
  /**
   * @deprecated No longer used. All thumbnails are now generated at 1280x720 resolution.
   * Kept for backward compatibility.
   */
  height?: number;
  /**
   * @deprecated No longer used. All thumbnails are now generated in high quality format.
   * Kept for backward compatibility.
   */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  style?: string;
  /**
   * Controls the background transparency of the generated thumbnail.
   * - 'transparent': Creates PNG with transparency
   * - 'opaque': Creates PNG with solid background
   * - 'auto': Let the model decide based on the content
   */
  background?: 'transparent' | 'opaque' | 'auto';
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
  size?: '1024x1024' | '1536x1024' | '1024x1536';
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