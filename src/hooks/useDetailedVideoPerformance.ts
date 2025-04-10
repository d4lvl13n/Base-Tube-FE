import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChannelVideosPerformance } from '../api/analytics';
import type { VideoPerformanceResponse } from '../types/analytics';

// Define valid sortable fields based on the API options
type SortableField = 'views' | 'likes' | 'comments' | 'average_watch_duration_seconds' | 'average_percentage_viewed' | 'createdAt';
type SortOrder = 'asc' | 'desc';
// Define valid time periods for filtering
type TimePeriod = 'all' | '7d' | '30d' | '90d';

interface UseDetailedVideoPerformanceOptions {
  initialLimit?: number;
  initialSortBy?: SortableField;
  initialSortOrder?: SortOrder;
  initialPeriod?: TimePeriod;
}

export const useDetailedVideoPerformance = (
  channelId: string | undefined, 
  options: UseDetailedVideoPerformanceOptions = {}
) => {
  const { 
    initialLimit = 10, 
    initialSortBy = 'createdAt', 
    initialSortOrder = 'desc',
    initialPeriod = 'all'
  } = options;

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [sortBy, setSortBy] = useState<SortableField>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);

  const queryOptions = {
    page,
    limit,
    sort_by: sortBy,
    order: sortOrder,
    period // Add period to the API query parameters
  };

  const queryResult = useQuery<VideoPerformanceResponse, Error>({
    // Query key includes channelId and all options that trigger a refetch
    queryKey: ['channelVideoPerformance', channelId, queryOptions], 
    queryFn: () => {
      if (!channelId) {
        // Should not happen if enabled is set correctly, but good practice
        throw new Error('Channel ID is required to fetch video performance');
      }
      return getChannelVideosPerformance(channelId, queryOptions);
    },
    // Keep data fresh based on options, but use staleTime for caching
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Only run the query if channelId is available
    enabled: !!channelId,
    retry: 2,
  });

  // Handler for changing sort
  const handleSort = (field: SortableField) => {
    if (sortBy === field) {
      // Toggle order if sorting by the same field
      setSortOrder(currentOrder => (currentOrder === 'desc' ? 'asc' : 'desc'));
    } else {
      // Reset to descending order when changing field
      setSortBy(field);
      setSortOrder('desc');
    }
    // Reset to page 1 when sorting changes
    setPage(1); 
  };

  // Handler for changing time period
  const handlePeriodChange = (newPeriod: TimePeriod) => {
    if (period !== newPeriod) {
      setPeriod(newPeriod);
      // Reset to page 1 when period changes
      setPage(1);
    }
  };

  return {
    // Data and state
    data: queryResult.data,
    videos: queryResult.data?.videos ?? [],
    pagination: queryResult.data?.pagination,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching, // Useful for showing loading indicators on refetch
    isPlaceholderData: queryResult.isPlaceholderData,
    error: queryResult.error,
    
    // Current options state
    currentPage: page,
    limit,
    sortBy,
    sortOrder,
    period,

    // State setters/handlers
    setPage,
    setLimit, // Allow changing limit if needed
    handleSort, // Use this in table headers
    handlePeriodChange, // Use this for period selector
  };
}; 