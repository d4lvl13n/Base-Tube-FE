import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { thumbnailApi } from '../api/thumbnail';
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

/**
 * Hook for AI thumbnail generation
 * 
 * @note Use size: "landscape" for YouTube/BaseTube or size: "short" for Shorts/TikTok.
 * Width and height are kept for backward compatibility but should not be used by new callers.
 */
interface UseAIThumbnailResult {
  // Video-specific thumbnail generation
  generateForVideo: (videoId: number, options?: ThumbnailGenerationOptions) => Promise<ThumbnailGenerationResponse>;
  isGeneratingForVideo: boolean;
  videoGenerationError: Error | null;
  
  // Custom prompt thumbnail generation
  generateFromPrompt: (options: CustomThumbnailGenerationOptions) => Promise<CustomThumbnailGenerationResponse>;
  isGeneratingFromPrompt: boolean;
  promptGenerationError: Error | null;
  
  // Reference image thumbnail generation
  generateWithReference: (options: ThumbnailWithReferenceOptions) => Promise<ThumbnailWithReferenceResponse>;
  isGeneratingWithReference: boolean;
  referenceGenerationError: Error | null;

  // Conversational thumbnail refinement
  refineThumbnail: (options: ThumbnailRefinementOptions) => Promise<ThumbnailRefinementResponse>;
  isRefiningThumbnail: boolean;
  refinementError: Error | null;
  
  // General state
  resetErrors: () => void;
}

const EMPTY_THUMBNAILS: ThumbnailItem[] = [];

const flattenUniqueThumbnails = (pages?: ThumbnailGalleryResponse[]): ThumbnailItem[] => {
  if (!pages?.length) return EMPTY_THUMBNAILS;

  const seen = new Set<string>();
  const thumbnails: ThumbnailItem[] = [];

  pages.forEach(page => {
    page.thumbnails.forEach(thumbnail => {
      if (seen.has(thumbnail.id)) return;
      seen.add(thumbnail.id);
      thumbnails.push(thumbnail);
    });
  });

  return thumbnails;
};

/**
 * Hook for AI thumbnail gallery browsing and downloading
 * 
 * @param params - Parameters for filtering and paginating the thumbnail gallery
 * @param enabled - Whether to enable the query (default: true)
 * @returns An object with thumbnail data, download functions, and query states
 * 
 * @example
 * // Basic usage:
 * const { thumbnails, isLoading } = useAIThumbnailGallery({ limit: 12 });
 * 
 * // With search:
 * const { thumbnails } = useAIThumbnailGallery({ search: 'gaming' });
 * 
 * // Downloading:
 * const { downloadThumbnail, triggerDownload } = useAIThumbnailGallery();
 * 
 * // Then in your component:
 * <button onClick={() => triggerDownload(thumbnailId)}>Download</button>
 */
export const useAIThumbnailGallery = (params: ThumbnailGalleryParams = {}, enabled = true) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<ThumbnailGalleryResponse>({
    queryKey: ['thumbnailGallery', params],
    queryFn: () => thumbnailApi.getThumbnailGallery(params),
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Fetch a specific thumbnail by ID
   * @param id - The thumbnail ID
   * @returns Promise with the thumbnail details
   */
  const fetchThumbnailById = useCallback(async (id: string): Promise<ThumbnailItem> => {
    return thumbnailApi.getThumbnailById(id);
  }, []);

  /**
   * Download a thumbnail as a blob for programmatic use
   * @param id - The thumbnail ID
   * @param responseType - The response type ('blob' or 'arraybuffer')
   * @returns Promise with the blob or arraybuffer data
   */
  const downloadThumbnail = useCallback(async (
    id: string, 
    responseType: 'blob' | 'arraybuffer' = 'blob'
  ): Promise<Blob | ArrayBuffer> => {
    return thumbnailApi.downloadThumbnail(id, { responseType });
  }, []);

  /**
   * Create a URL from a blob for use in src attributes or other URL contexts
   * @param blob - The downloaded blob
   * @returns An object URL that can be used in src attributes
   * @note Remember to release the URL with URL.revokeObjectURL when done
   */
  const createObjectURL = useCallback((blob: Blob): string => {
    return URL.createObjectURL(blob);
  }, []);

  /**
   * Trigger a direct download of the thumbnail in the browser
   * @param id - The thumbnail ID
   * @param filename - Optional custom filename
   */
  const triggerDownload = useCallback((id: string, filename?: string): void => {
    thumbnailApi.triggerThumbnailDownload(id, filename);
  }, []);

  /**
   * Fetch and create an object URL for the thumbnail in one step
   * @param id - The thumbnail ID
   * @returns Promise with the object URL
   * @note Remember to release the URL with URL.revokeObjectURL when done
   */
  const fetchAndCreateObjectURL = useCallback(async (id: string): Promise<string> => {
    const blob = await downloadThumbnail(id) as Blob;
    return createObjectURL(blob);
  }, [createObjectURL, downloadThumbnail]);

  return {
    // Thumbnail data
    thumbnails: data?.thumbnails ?? EMPTY_THUMBNAILS,
    totalCount: data?.count ?? 0,
    limit: data?.limit || params.limit || 30,
    offset: data?.offset || params.offset || 0,
    hasMore: data?.hasMore ?? false,
    
    // Query states
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    
    // Thumbnail operations
    fetchThumbnailById,
    
    // Download operations
    downloadThumbnail,
    createObjectURL,
    triggerDownload,
    fetchAndCreateObjectURL
  };
};

export const useAIThumbnailInfiniteGallery = (params: ThumbnailGalleryParams = {}, enabled = true) => {
  const queryParams = useMemo<ThumbnailGalleryParams>(() => {
    const nextParams = { ...params };
    delete nextParams.offset;
    nextParams.limit = nextParams.limit ?? 30;
    return nextParams;
  }, [params]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<ThumbnailGalleryResponse>({
    queryKey: ['thumbnailGallery', 'infinite', queryParams],
    queryFn: ({ pageParam = 0 }) => thumbnailApi.getThumbnailGallery({
      ...queryParams,
      offset: Number(pageParam)
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.offset + lastPage.limit;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const thumbnails = useMemo(() => flattenUniqueThumbnails(data?.pages), [data?.pages]);
  const firstPage = data?.pages[0];
  const lastPage = data?.pages[data.pages.length - 1];

  const fetchThumbnailById = useCallback(async (id: string): Promise<ThumbnailItem> => {
    return thumbnailApi.getThumbnailById(id);
  }, []);

  const downloadThumbnail = useCallback(async (
    id: string,
    responseType: 'blob' | 'arraybuffer' = 'blob'
  ): Promise<Blob | ArrayBuffer> => {
    return thumbnailApi.downloadThumbnail(id, { responseType });
  }, []);

  const createObjectURL = useCallback((blob: Blob): string => {
    return URL.createObjectURL(blob);
  }, []);

  const triggerDownload = useCallback((id: string, filename?: string): void => {
    thumbnailApi.triggerThumbnailDownload(id, filename);
  }, []);

  const fetchAndCreateObjectURL = useCallback(async (id: string): Promise<string> => {
    const blob = await downloadThumbnail(id) as Blob;
    return createObjectURL(blob);
  }, [createObjectURL, downloadThumbnail]);

  return {
    thumbnails,
    totalCount: firstPage?.count ?? 0,
    limit: lastPage?.limit || queryParams.limit || 30,
    offset: lastPage?.offset || 0,
    hasMore: hasNextPage ?? false,

    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,

    fetchThumbnailById,
    downloadThumbnail,
    createObjectURL,
    triggerDownload,
    fetchAndCreateObjectURL
  };
};

/**
 * Hook for AI thumbnail generation functionality
 * 
 * @returns An object with methods for generating thumbnails and associated state
 * 
 * @example
 * // Generate a vertical short-form thumbnail
 * const { generateFromPrompt } = useAIthumbnail();
 * 
 * generateFromPrompt({
 *   prompt: "Create a bold gaming channel thumbnail",
 *   size: "short"
 * });
 */
export const useAIthumbnail = (): UseAIThumbnailResult => {
  const queryClient = useQueryClient();
  
  // Error states
  const [videoGenerationError, setVideoGenerationError] = useState<Error | null>(null);
  const [promptGenerationError, setPromptGenerationError] = useState<Error | null>(null);
  const [referenceGenerationError, setReferenceGenerationError] = useState<Error | null>(null);
  const [refinementError, setRefinementError] = useState<Error | null>(null);
  
  // Create mutations for each API endpoint
  const videoMutation = useMutation({
    mutationFn: ({ videoId, options }: { videoId: number, options?: ThumbnailGenerationOptions }) => 
      thumbnailApi.generateThumbnailForVideo(videoId, options),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['thumbnailGallery'] });
    },
    onError: (error: Error) => {
      setVideoGenerationError(error);
    }
  });
  
  const promptMutation = useMutation({
    mutationFn: (options: CustomThumbnailGenerationOptions) => 
      thumbnailApi.generateThumbnailFromPrompt(options),
    onSuccess: () => {
      // Invalidate thumbnail gallery queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['thumbnailGallery'] });
    },
    onError: (error: Error) => {
      setPromptGenerationError(error);
    }
  });
  
  const referenceMutation = useMutation({
    mutationFn: (options: ThumbnailWithReferenceOptions) => 
      thumbnailApi.generateThumbnailWithReference(options),
    onSuccess: () => {
      // Invalidate thumbnail gallery queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['thumbnailGallery'] });
    },
    onError: (error: Error) => {
      setReferenceGenerationError(error);
    }
  });

  const refinementMutation = useMutation({
    mutationFn: (options: ThumbnailRefinementOptions) =>
      thumbnailApi.refineThumbnailConversationally(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thumbnailGallery'] });
    },
    onError: (error: Error) => {
      setRefinementError(error);
    }
  });
  
  const resetErrors = () => {
    setVideoGenerationError(null);
    setPromptGenerationError(null);
    setReferenceGenerationError(null);
    setRefinementError(null);
  };
  
  return {
    // Video thumbnail generation
    generateForVideo: (videoId: number, options?: ThumbnailGenerationOptions) => 
      videoMutation.mutateAsync({ videoId, options }),
    isGeneratingForVideo: videoMutation.isPending,
    videoGenerationError,
    
    // Custom prompt thumbnail generation
    generateFromPrompt: (options: CustomThumbnailGenerationOptions) => 
      promptMutation.mutateAsync(options),
    isGeneratingFromPrompt: promptMutation.isPending,
    promptGenerationError,
    
    // Reference image thumbnail generation
    generateWithReference: (options: ThumbnailWithReferenceOptions) => 
      referenceMutation.mutateAsync(options),
    isGeneratingWithReference: referenceMutation.isPending,
    referenceGenerationError,

    // Conversational refinement
    refineThumbnail: (options: ThumbnailRefinementOptions) =>
      refinementMutation.mutateAsync(options),
    isRefiningThumbnail: refinementMutation.isPending,
    refinementError,
    
    // Reset all errors
    resetErrors
  };
};
