// src/types/channel.ts

export interface Channel {
  id: number;
  name: string;
  description?: string;
  unique_id: string;
  channel_image_path?: string;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
  subscribers_count: number;
  isOwner: boolean;
  isSubscribed: boolean;
  ownerUsername: string;
  ownerPicture?: string;
  createdAt: string;
  updatedAt: string;
  videosCount?: number;
}

export interface ChannelResponse {
  success: boolean;
  channel: Channel;
  message?: string;
}

export interface ChannelsResponse {
  success: boolean;
  data: Channel[];
  total: number;
  totalPages: number;
}

export interface CreateChannelData {
  name: string;
  description: string;
  channel_image?: File;
  cover_image?: File;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
}

export interface UpdateChannelData extends Partial<Omit<Channel, 'id' | 'user_id' | 'unique_id'>> {
  channel_image?: File;
  cover_image?: File;
}

// Helper type for form data conversion
export interface ChannelFormData extends FormData {
  append(name: keyof CreateChannelData | keyof UpdateChannelData, value: string | Blob): void;
}