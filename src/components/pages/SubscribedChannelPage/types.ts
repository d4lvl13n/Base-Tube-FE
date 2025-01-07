export type SortOption = 'subscribers_count' | 'createdAt' | 'name';

export interface SubscribedChannel {
  id: number;
  name: string;
  handle: string;
  description?: string;
  channel_image_url?: string;
  channel_image_path?: string;
  ownerProfileImage?: string | null;
  ownerUsername?: string | null;
  subscribers_count: number;
  isOwner: boolean;
  isSubscribed: boolean;
  unique_id: string;
  createdAt: string;
  updatedAt: string;
  last_video_at?: string;
  hasNewContent?: boolean;
  user?: {
    username: string;
    profile_image_url: string | null;
  };
}

export interface SubscribedChannelPageProps {
  channels?: SubscribedChannel[];
  isLoading: boolean;
  error?: string;
}

export interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

export interface PageSizeSelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}