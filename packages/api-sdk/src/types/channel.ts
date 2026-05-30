/** Mirrors `Channels` as exposed by channel endpoints. */
export interface Channel {
  id: number;
  name: string;
  handle: string;
  description?: string;
  unique_id: string;
  channel_image_path?: string;
  channel_image_url?: string;
  facebook_link?: string | null;
  instagram_link?: string | null;
  twitter_link?: string | null;
  subscribers_count: number;
  videos_count: number;
  isOwner?: boolean;
  isSubscribed?: boolean;
  ownerUsername?: string;
  ownerProfileImage?: string | null;
  createdAt: string;
  updatedAt: string;
  last_video_at?: string;
  hasNewContent?: boolean;
}

export type ChannelSortOption = 'subscribers_count' | 'updatedAt' | 'createdAt';

export interface GetChannelsOptions {
  page?: number;
  limit?: number;
  sort?: ChannelSortOption;
  minSubscribers?: number;
  search?: string;
}

/** `GET /api/v1/channels` returns channels under a `channels` key (not `data`). */
export interface GetChannelsResponse {
  success: boolean;
  channels: Channel[];
  total: number;
  hasMore?: boolean;
  currentPage?: number;
  itemsPerPage?: number;
}

/** `GET /api/v1/channels/popular` returns channels under a `data` key. */
export interface PopularChannelsResponse {
  success: boolean;
  data: Channel[];
  total: number;
  totalPages?: number;
}

export interface ChannelResponse {
  success: boolean;
  channel: Channel;
  message?: string;
}
