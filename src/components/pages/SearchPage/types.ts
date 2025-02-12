
export type SearchSortOption = 'relevance' | 'date' | 'views';

export interface SearchResult {
  id: number;
  title: string;
  search_text: string;
  thumbnail_url: string;
  thumbnail_path: string;
  duration: number;
  views_count: number;
  relevance: number;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
}

export interface SearchPageProps {
  results?: SearchResult[];
  isLoading: boolean;
  error?: string;
}

export interface SearchFilterProps {
  sortBy: SearchSortOption;
  setSortBy: (value: SearchSortOption) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
} 