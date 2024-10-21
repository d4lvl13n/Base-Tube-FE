import { Video } from './video';

export interface User {
  id: string;
  name: string;
  email: string;
  dob: string;
  picture: string;
  description: string;
  videoCount: number;
  totalViews: number;
  nftCount: number;
  createdAt: string;
  updatedAt: string;
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
  balance: number;
  transactions: Transaction[]; // Updated to use Transaction interface
}

export interface Transaction {
  id: number;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string; // Transaction hash on blockchain
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