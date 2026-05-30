import type { Channel } from './channel';

export type OnboardingStatus = 'PENDING' | 'COMPLETED';

/** Mirrors `Users` as exposed by the profile/auth endpoints. */
export interface User {
  id: string;
  username: string;
  email: string;
  onboarding_status: OnboardingStatus;
  profile_image_url: string;
  name: string | null;
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
  subscribers?: number;
  bio?: string;
}

export interface UserWallet {
  walletAddress: string;
  lastLogin: string | null;
  linkedAt: string;
  balance?: number;
}
