import api from './index';
import {
  ThumbnailGenerationOptions,
  ThumbnailGenerationResponse,
  CustomThumbnailGenerationOptions,
  CustomThumbnailGenerationResponse,
  ThumbnailWithReferenceOptions,
  ThumbnailWithReferenceResponse,
  ThumbnailRefinementOptions,
  ThumbnailRefinementResponse,
  ThumbnailGalleryParams,
  ThumbnailGalleryResponse,
  ThumbnailItem
} from '../types/thumbnail';

export const thumbnailApi = {
  /**
   * Fetch thumbnails from the gallery with filtering and pagination options
   * @param params - Optional parameters for filtering and pagination
   * @returns A promise that resolves with the gallery response including thumbnails and pagination info
   */
  getThumbnailGallery: async (
    params: ThumbnailGalleryParams = {}
  ): Promise<ThumbnailGalleryResponse> => {
    const { search, videoId, used, limit = 30, offset = 0, sort = 'created_at', order = 'desc' } = params;
    
    // Build the query string with only defined parameters
    const queryParams = new URLSearchParams();
    
    if (search !== undefined) queryParams.append('search', search);
    if (videoId !== undefined) queryParams.append('videoId', videoId.toString());
    if (used !== undefined) queryParams.append('used', used.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    queryParams.append('sort', sort);
    queryParams.append('order', order);
    
    const response = await api.get(`/api/v1/thumbnails?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get details for a specific thumbnail by ID
   * @param id - The thumbnail ID
   * @returns A promise that resolves with the thumbnail details
   */
  getThumbnailById: async (id: number): Promise<ThumbnailItem> => {
    const response = await api.get(`/api/v1/thumbnails/${id}`);
    return response.data;
  },

  /**
   * Download a thumbnail image and track usage statistics (no authentication required)
   * @param thumbnailId - The ID of the thumbnail to download
   * @param options - Optional download options
   * @returns A promise that resolves with the image blob data
   */
  downloadThumbnail: async (
    thumbnailId: number,
    options: { responseType?: 'blob' | 'arraybuffer' } = { responseType: 'blob' }
  ): Promise<Blob | ArrayBuffer> => {
    const response = await api.get(`/api/v1/thumbnails/${thumbnailId}/download`, {
      responseType: options.responseType
    });
    return response.data;
  },

  /**
   * Trigger a direct browser download of a thumbnail
   * @param thumbnailId - The ID of the thumbnail to download
   * @param filename - Optional custom filename (defaults to thumbnail-{id}.webp)
   */
  triggerThumbnailDownload: (thumbnailId: number, filename?: string): void => {
    // Create a link to trigger the download
    const link = document.createElement('a');
    link.href = `/api/v1/thumbnails/${thumbnailId}/download`;
    link.download = filename || `thumbnail-${thumbnailId}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Generate a thumbnail for a specific video ID.
   * @param videoId - The ID of the video
   * @param options - Options for thumbnail generation
   * @returns A promise that resolves with the thumbnail URL and prompt used
   * 
   * @note Use size: "landscape" for YouTube/BaseTube or size: "short" for Shorts/TikTok.
   * Width and height are kept for backward compatibility but should not be used by new callers.
   */
  generateThumbnailForVideo: async (
    videoId: number,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailGenerationResponse> => {
    const response = await api.post(
      `/api/v1/thumbnails/videos/${videoId}/thumbnail/generate`,
      options,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10 * 60 * 1000 // allow long-running generation (10 minutes)
      }
    );
    return response.data;
  },

  /**
   * Generate a standalone thumbnail using a custom prompt.
   * @param options - Options for thumbnail generation including required prompt
   * @returns A promise that resolves with the thumbnail URL, path, and prompt used
   * 
   * @note Use size: "landscape" for YouTube/BaseTube or size: "short" for Shorts/TikTok.
   * Width and height are kept for backward compatibility but should not be used by new callers.
   */
  generateThumbnailFromPrompt: async (
    options: CustomThumbnailGenerationOptions
  ): Promise<CustomThumbnailGenerationResponse> => {
    const response = await api.post(
      '/api/v1/thumbnails/thumbnail/generate',
      options,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10 * 60 * 1000 // allow long-running generation (10 minutes)
      }
    );
    return response.data;
  },

  /**
   * Generate a thumbnail using a reference image to influence the style and composition.
   * @param options - Options including the reference image, optional videoId, and other generation parameters
   * @returns A promise that resolves with the thumbnail URL, path, and prompt used
   * 
   * @note Use size: "landscape" for YouTube/BaseTube or size: "short" for Shorts/TikTok.
   * Width and height are kept for backward compatibility but should not be used by new callers.
   */
  generateThumbnailWithReference: async (
    options: ThumbnailWithReferenceOptions
  ): Promise<ThumbnailWithReferenceResponse> => {
    const formData = new FormData();
    
    // Add the reference image
    formData.append('referenceImage', options.referenceImage);
    
    // Add optional parameters
    if (options.videoId) {
      formData.append('videoId', options.videoId.toString());
    }
    
    if (options.customPrompt) {
      formData.append('customPrompt', options.customPrompt);
    }
    
    // Async mode and tuning
    if (options.async) formData.append('async', 'true');
    if (options.size) formData.append('size', options.size);
    if (options.quality) formData.append('quality', options.quality);
    if (options.n) formData.append('n', String(options.n));
    
    if (options.style) {
      formData.append('style', options.style);
    }
    
    // Add background parameter. GPT Image 2 does not support transparent output.
    if (options.background) {
      formData.append('background', options.background);
    }
    
    // Add reference image detail parameter
    if (options.referenceImageDetail) {
      formData.append('referenceImageDetail', options.referenceImageDetail);
    }
    
    const response = await api.post(
      '/api/v1/thumbnails/thumbnail/generate-with-reference',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10 * 60 * 1000 // allow long-running generation (10 minutes)
      }
    );
    
    return response.data;
  },

  /**
   * Refine an existing/generated thumbnail conversationally.
   * The first call can use thumbnailId, imageUrl, or image. Follow-ups should pass
   * previousResponseId and/or imageGenerationCallId returned by the API.
   */
  refineThumbnailConversationally: async (
    options: ThumbnailRefinementOptions
  ): Promise<ThumbnailRefinementResponse> => {
    const hasUpload = Boolean(options.image);

    const appendCommonFields = (target: FormData | Record<string, unknown>) => {
      const setValue = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '') return;
        if (target instanceof FormData) {
          target.append(key, String(value));
        } else {
          target[key] = value;
        }
      };

      setValue('instruction', options.instruction);
      setValue('thumbnailId', options.thumbnailId);
      setValue('imageUrl', options.imageUrl);
      setValue('previousResponseId', options.previousResponseId);
      setValue('imageGenerationCallId', options.imageGenerationCallId);
      setValue('size', options.size);
      setValue('quality', options.quality);
      setValue('style', options.style);
      setValue('background', options.background);
    };

    if (hasUpload && options.image) {
      const formData = new FormData();
      formData.append('image', options.image);
      appendCommonFields(formData);

      const response = await api.post(
        '/api/v1/thumbnails/thumbnail/conversation/refine',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10 * 60 * 1000
        }
      );
      return response.data;
    }

    const payload: Record<string, unknown> = {};
    appendCommonFields(payload);

    const response = await api.post(
      '/api/v1/thumbnails/thumbnail/conversation/refine',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10 * 60 * 1000
      }
    );

    return response.data;
  }
};
