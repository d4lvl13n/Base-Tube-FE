import { Channel, ChannelSortOption } from '../../../types/channel';
import { LucideIcon } from 'lucide-react';

export interface ChannelCardProps {
  channel: Channel;
}

export interface NavigationOption {
  key: ChannelSortOption;
  icon: LucideIcon;
  label: string;
  description: string;
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
  handleSortChange: (newSort: ChannelSortOption) => void;
  navigationOptions: NavigationOption[];
  isLoadingMore: boolean;
}

export interface ExtendedChannel extends Channel {
  ownerName?: string;
}