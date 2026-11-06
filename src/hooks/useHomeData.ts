import { useQuery } from '@tanstack/react-query';
import { getFeaturedVideos, getRecommendedVideos } from '../api/video';
import { getPopularChannels } from '../api/channel';

const freshHomeData = { staleTime: 60_000, gcTime: 5 * 60_000, retry: false, refetchOnWindowFocus: false } as const;

/** Independent sections: one slow source must not hold the ready ones. */
export function useHomeData() {
  const featured = useQuery({ queryKey: ['videos', 'featured', 3], queryFn: () => getFeaturedVideos(3), ...freshHomeData });
  const recommended = useQuery({ queryKey: ['videos', 'recommended', 1, 8], queryFn: () => getRecommendedVideos(1, 8), ...freshHomeData });
  const channels = useQuery({ queryKey: ['channels', 'popular', 1, 12], queryFn: () => getPopularChannels(1, 12), ...freshHomeData });
  return { featured, recommended, channels };
}
