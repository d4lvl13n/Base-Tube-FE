// src/types/users.ts

export interface User {
  id: number;
  email: string;
  name: string;
  dob?: string;
  picture?: string;
  description?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  channel_image_path: string | null;
  subscribers_count: number;
  isApproved: number;
  status: number;
  videosCount: number;
  facebook_link: string | null;
  instagram_link: string | null;
  twitter_link: string | null;
  unique_id: string;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: number;
  user_id: number;
  channel_id: number;
  title: string;
  description: string;
  video_path: string;
  thumbnail_path: string;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  is_public: boolean;
  is_featured: boolean;
  trending_score: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserWallet {
  tubeBalance: number;
  totalEarnings: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

// If you still need UserProfile, UserVideo, and UserNFT interfaces, you can keep them,
// but update them to match the new structure:

export interface UserProfile extends User {
  subscribers?: number;
  totalViews?: number;
  nftCount?: number;
  videoCount?: number;
}

export interface UserVideo extends Pick<Video, 'id' | 'title' | 'thumbnail_path' | 'views' | 'createdAt'> {}

export interface UserNFT {
  id: number;
  name: string;
  image_path: string;
  rarity: string;
}