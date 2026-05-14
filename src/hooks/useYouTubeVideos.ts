import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchYouTubeVideos, type YouTubeVideosPageData } from '../api/youtubeVideos';

export function useYouTubeVideos(options: {
  enabled?: boolean;
  maxResults?: number;
}) {
  const { enabled = true, maxResults = 20 } = options;

  return useInfiniteQuery<YouTubeVideosPageData>({
    queryKey: ['youtube', 'creator-videos'],
    queryFn: ({ pageParam }) =>
      fetchYouTubeVideos({
        maxResults,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
