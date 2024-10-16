// src/types/channel.ts

import { User } from './user';

export interface Channel {
  id: number;
  user_id: number;
  name: string;
  description: string;
  channel_image_path: string;
  cover_image_path?: string;
  subscribers_count: number;
  isApproved: number;
  status: number;
  videosCount: number;
  facebook_link?: string | null;
  instagram_link?: string | null;
  twitter_link?: string | null;
  unique_id: string;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
  isOwner?: boolean;
  subscribeStatus?: number;
  ownerPicture?: string;
  User?: User;
}