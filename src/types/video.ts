// src/types/video.ts

import { Channel } from './channel';

export interface Video {
  id: number;
  user_id: number;
  channel_id: number;
  title: string;
  description: string;
  processed_video_paths: string[];
  thumbnail_path: string;
  views: number;
  likes: number;
  dislikes: number;
  is_public: boolean;
  is_featured: boolean;
  trending_score: number;
  is_nft_content: boolean;
  createdAt: string;
  updatedAt: string;
  channel: Channel;
}
