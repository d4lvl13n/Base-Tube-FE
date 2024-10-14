// types/user.ts

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  subscribers: number;
  totalViews: number;
  nftCount: number;
  videoCount: number;
}

export interface UserVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  uploadDate: string;
}

export interface UserNFT {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
}

export interface UserWallet {
  tubeBalance: number;
  totalEarnings: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}