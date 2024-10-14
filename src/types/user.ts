// src/types/user.ts

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar_path?: string;
  subscribers?: number;
  totalViews?: number;
  nftCount?: number;
  videoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserVideo {
  id: number;
  title: string;
  thumbnail_path: string;
  views: number;
  createdAt: string;
}

export interface UserNFT {
  id: number;
  name: string;
  image_path: string;
  rarity: string;
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
