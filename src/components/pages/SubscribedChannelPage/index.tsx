import React, { useState, useMemo } from 'react';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import { 
  ChannelGrid, 
  SubscribedChannelCard, 
  ErrorMessage, 
} from './styles';
import FilterPanel from './FilterPanel';
import PlaceholderChannelCard from '../../common/PlaceholderChannelCard';
import { useSubscribedChannels } from '../../../hooks/useSubscribedChannels';
import InfiniteScroll from 'react-infinite-scroll-component';
import { SortOption } from './types';

const SubscribedChannelPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortOption>('subscribers_count');
  const [pageSize, setPageSize] = useState<number>(24);
  const [showNewContent, setShowNewContent] = useState(false);

  const { 
    channels, 
    isLoading, 
    error, 
    hasNextPage, 
    fetchNextPage,
    markAsWatched,
  } = useSubscribedChannels({
    limit: pageSize,
    sort: sortBy
  });

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    return showNewContent 
      ? channels.filter(channel => channel.hasNewContent)
      : channels;
  }, [channels, showNewContent]);

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen">
        <Header className="fixed top-0 left-0 right-0 z-50" />
        <div className="flex pt-16">
          <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
          <main className="flex-1 p-8 overflow-auto ml-16">
            <ErrorMessage message={error.message} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
        <main 
          className="flex-1 p-8 overflow-auto ml-16" 
          id="scrollableDiv"
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Subscribed Channels</h1>
            <FilterPanel
              sortBy={sortBy}
              setSortBy={setSortBy}
              pageSize={pageSize}
              setPageSize={setPageSize}
              showNewContent={showNewContent}
              setShowNewContent={setShowNewContent}
            />
          </div>
          
          {isLoading ? (
            <ChannelGrid>
              {Array(pageSize).fill(null).map((_, i) => (
                <PlaceholderChannelCard key={i} />
              ))}
            </ChannelGrid>
          ) : filteredChannels.length > 0 ? (
            <InfiniteScroll
              dataLength={filteredChannels.length}
              next={fetchNextPage}
              hasMore={hasNextPage}
              loader={null}
              scrollableTarget="scrollableDiv"
              endMessage={
                <p className="text-center text-gray-400 mt-8 mb-8">
                  You've reached the end of the list
                </p>
              }
            >
              <ChannelGrid>
                {filteredChannels.map((channel) => (
                  <SubscribedChannelCard 
                    key={channel.id} 
                    channel={channel}
                    onWatched={markAsWatched}
                  />
                ))}
              </ChannelGrid>
            </InfiniteScroll>
          ) : (
            <div className="text-center text-gray-400 mt-16">
              <p className="text-xl">
                {showNewContent 
                  ? 'No channels with new content'
                  : 'No subscribed channels yet'
                }
              </p>
              <p className="mt-2">
                {showNewContent 
                  ? 'All caught up!'
                  : 'Discover and subscribe to channels you like'
                }
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SubscribedChannelPage;