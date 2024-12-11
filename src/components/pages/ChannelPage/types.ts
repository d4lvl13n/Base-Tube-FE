import { Channel, ChannelSortOption } from '../../../types/channel';
import { LucideIcon } from 'lucide-react';

export interface ChannelCardProps {
  channel: Channel;
}

export interface SortOption {
  key: ChannelSortOption;
  icon: LucideIcon;
  label: string;
}

export interface ChannelPageStylesProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sort: ChannelSortOption;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  handleLoadMore: () => void;
  handleSortChange: (newSort: ChannelSortOption) => void; // Updated type here
  sortOptions: SortOption[];
  isLoadingMore: boolean;
}

// Ensure handle is a string to match the Channel interface
export interface ExtendedChannel extends Channel {
  ownerName?: string;
  }

export interface FloatingNavigationOption {
  key: ChannelSortOption;
  icon: LucideIcon;
  label: string;
}

export interface FloatingNavigationProps {
  options: SortOption[];
  activeOption: ChannelSortOption;
  setActiveOption: (option: ChannelSortOption) => void;
}