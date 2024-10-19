// src/types/user.ts
import { Video } from './video';
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
  walletAddress?: string | null; // Added walletAddress to match backend
}

export interface Channel {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  channel_image_path?: string | null;
  subscribers_count: number;
  isApproved: boolean;
  status: number;
  videosCount: number;
  facebook_link?: string | null;
  instagram_link?: string | null;
  twitter_link?: string | null;
  unique_id: string;
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerPicture?: string | null; // Added ownerPicture to match usage in VideoCard
}


export interface UserWallet {
  walletAddress: string;
  balance: number; // in ETH or Base tokens
  tubeBalance: number; // in TUBE tokens
  totalEarnings: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string; // Transaction hash on blockchain
}

// Updated UserProfile interface to extend User and include additional fields
export interface UserProfile extends User {
  subscribers?: number;
  totalViews?: number;
  nftCount?: number;
  videoCount?: number;
  bio?: string;
}

// Updated UserVideo to include all properties of Video
export interface UserVideo extends Video {
  // Optionally, you can add additional properties specific to UserVideo here
}

// Updated UserNFT interface
export interface UserNFT {
  id: number;
  name: string;
  image_path: string;
  rarity: string;
  description?: string;
  tokenId: string;
  contractAddress: string;
}
