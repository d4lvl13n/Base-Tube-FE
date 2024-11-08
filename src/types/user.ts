import { Video } from './video';
import { Channel } from './channel';
import type { UserResource } from '@clerk/types';

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  dob?: string | null;
  picture?: string | null;
  description?: string | null;
  referralCode?: string | null;
  notificationPreferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  } | null;
  videoCount: number;
  totalViews: number | null;
  nftCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  channels: Channel[];
}

export interface UserWallet {
  walletAddress: string;
  balance: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
}

// UserProfile extends User and includes additional fields
export interface UserProfile extends User {
  subscribers?: number;
  bio?: string;
}

// UserVideo extends Video
export interface UserVideo extends Video {
  // Add any additional properties specific to UserVideo here
}

// UserNFT interface
export interface UserNFT {
  id: number;
  name: string;
  image_path: string;
  rarity: string;
  description?: string;
  tokenId: string;
  contractAddress: string;
}

export interface ProfileSettings {
    email: string;
    notificationPreferences: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      // Add other preference fields as needed
    };
  }

// Extend the Clerk UserResource type with our custom properties
export interface ExtendedUser extends UserResource {
  totalViews?: number;
  videosWatched?: number;
  likesGiven?: number;
  commentsCount?: number;
}

// Add these new interfaces
export interface UserMetrics {
  totalViews: number;
  videosWatched: number;
  likesGiven: number;
  commentsCount: number;
  watchTimeStats: {
    totalWatchTimeHours: number;
    activeDays: number;
    dailyAverage: number;
  };
  recentActivity: {
    timestamp: string;
    action: 'Watched Video' | 'Liked Video' | 'Commented on Video';
    details: string;
    channelName?: string;
  }[];
}



export interface InteractionsHistory {
  id: number;
  user_id: string;
  video_id: number;
  comment: string;
  createdAt: string;
  video: {
    id: number;
    title: string;
    description: string;
    thumbnail_path: string;
  };
}

export interface ReferralInfo {
  id: number;
  user_id: string;
  code: string;
  referrals_count: number;
  earnings: number;
}