import React, { useState, useEffect } from 'react';
import { useSearch } from '../../../hooks/useSearch';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import VideoCard from '../../common/VideoCard';
import FilterPanel from './FilterPanel';
import { SearchSortOption, SearchResult } from './types';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Video, VideoStatus } from '../../../types/video';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialQuery = searchParams.get('query') || '';
  const initialSort = (searchParams.get('sort') as SearchSortOption) || 'relevance';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [sort, setSort] = useState<SearchSortOption>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(24);

  const { data, isLoading, error } = useSearch(initialQuery, page, pageSize, sort);

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (initialQuery) params.set('query', initialQuery);
    if (sort) params.set('sort', sort);
    params.set('page', page.toString());
    navigate(`/search?${params.toString()}`, { replace: true });
  }, [sort, page, initialQuery, navigate]);

  // Updated normalizeVideoData function with correct VideoStatus type
  const normalizeVideoData = (result: SearchResult): Video => {
    return {
      id: result.id,
      title: result.title,
      description: result.search_text || '',
      video_path: '', // Default empty string for video path
      video_url: undefined,
      thumbnail_path: result.thumbnail_path,
      thumbnail_url: result.thumbnail_url,
      duration: result.duration,
      views_count: result.views_count,
      user_id: 0,
      channel_id: 0,
      likes_count: 0,
      likes: 0,
      views: result.views_count,
      dislikes: 0,
      is_public: true,
      is_featured: false,
      trending_score: 0,
      is_nft_content: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comment_count: 0,
      like_count: 0,
      time_category: 'today',
      status: 'completed' as VideoStatus, // Using correct VideoStatus type
      processing_progress: {
        percent: 100,
        currentQuality: '1080p',
        totalQualities: 1,
        currentQualityIndex: 1
      }
    };
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
        <main className="flex-1 p-8 overflow-auto ml-16" id="scrollableDiv">
          <div className="max-w-7xl mx-auto">
            {/* Search Header with Stats and Filters */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {data?.data.length ? `Found ${data.data.length} results` : 'Search Results'}
                </h1>
                {initialQuery && (
                  <p className="text-gray-400">
                    Showing results for "{initialQuery}"
                  </p>
                )}
              </div>
              <FilterPanel
                sortBy={sort}
                setSortBy={setSort}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </div>

            {/* Results Display */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(pageSize).fill(null).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-800 rounded-xl h-64" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-500 mt-8">
                <p>Error: {error.toString()}</p>
              </div>
            ) : data?.data?.length ? (
              <InfiniteScroll
                dataLength={data.data.length}
                next={() => setPage(page + 1)}
                hasMore={data.data.length >= pageSize}
                loader={<h4>Loading...</h4>}
                scrollableTarget="scrollableDiv"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.data.map((result) => (
                    <VideoCard
                      key={result.id}
                      video={normalizeVideoData(result)}
                      size="normal"
                    />
                  ))}
                </div>
              </InfiniteScroll>
            ) : (
              <div className="text-center text-gray-400 mt-16">
                <p className="text-xl">No results found for "{initialQuery}"</p>
                <p className="mt-2">Try different keywords or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;