import React, { useState, useCallback } from 'react';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { useChannels } from '../../../hooks/useChannels';
import { ChannelPageLayout } from './styles';
import { NavigationOption } from './types';
import { ChannelSortOption } from '../../../types/channel';
import { useInView } from 'react-intersection-observer';

const ChannelPage: React.FC = () => {
  const [sort, setSort] = useState<ChannelSortOption>('subscribers_count');
  
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
    limit: 24,
    sort,
  }) || {};

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

  React.useEffect(() => {
    if (inView) {
      handleLoadMore();
    }
  }, [inView, handleLoadMore]);

  const navigationOptions: NavigationOption[] = React.useMemo(() => [
    { 
      key: 'subscribers_count', 
      icon: Users, 
      label: 'Most Subscribers',
      description: 'Channels ranked by subscriber count'
    },
    { 
      key: 'updatedAt', 
      icon: Clock, 
      label: 'Recently Active',
      description: 'Channels that have posted new content recently'
    },
    { 
      key: 'createdAt', 
      icon: TrendingUp, 
      label: 'New Channels',
      description: 'Recently created channels'
    },
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
        navigationOptions={navigationOptions}
        isLoadingMore={isFetchingNextPage}
      />
      <div ref={ref} style={{ height: '20px', margin: '20px 0' }} />
    </>
  );
};

export default ChannelPage;