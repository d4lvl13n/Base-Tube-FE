// ChannelPage.tsx
import React, { useState, useCallback } from 'react';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { useChannels } from '../../../hooks/useChannels';
import { ChannelPageLayout } from './styles';
import { SortOption } from './types';
import { ChannelSortOption } from '../../../types/channel';
import { useInView } from 'react-intersection-observer'; // Add this

const ChannelPage: React.FC = () => {
  const [sort, setSort] = useState<ChannelSortOption>('subscribers_count');
  
  // Add intersection observer for automatic infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1
  });

  const { 
    channels = [],
    hasMore,
    isLoading,
    error,
    fetchNextPage,
    isFetchingNextPage
  } = useChannels({
    limit: 24, // Increased from 12 for better initial load
    sort,
    }) || {}; // Add fallback empty object

  // Memoize handlers
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isFetchingNextPage && hasMore) {
      fetchNextPage();
    }
  }, [isLoading, isFetchingNextPage, hasMore, fetchNextPage]);

  const handleSortChange = useCallback((newSort: ChannelSortOption) => {
    if (newSort !== sort) {
      setSort(newSort);
    }
  }, [sort]);

  // Add automatic infinite scroll
  React.useEffect(() => {
    if (inView) {
      handleLoadMore();
    }
  }, [inView, handleLoadMore]);

  const sortOptions: SortOption[] = React.useMemo(() => [
    { key: 'subscribers_count', icon: Users, label: 'Most Subscribers' },
    { key: 'updatedAt', icon: Clock, label: 'Recently Active' },
    { key: 'createdAt', icon: TrendingUp, label: 'New Channels' },
  ], []);

  return (
    <>
      <ChannelPageLayout
        channels={channels}
        loading={isLoading}
        error={error ? 'Failed to load channels' : null}
        hasMore={hasMore}
        sort={sort}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        handleLoadMore={handleLoadMore}
        handleSortChange={handleSortChange}
        sortOptions={sortOptions}
        isLoadingMore={isFetchingNextPage}
      />
      {/* Infinite scroll trigger */}
      <div ref={ref} style={{ height: '20px', margin: '20px 0' }} />
    </>
  );
};

export default ChannelPage;