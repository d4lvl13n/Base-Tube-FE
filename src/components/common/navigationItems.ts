import { Compass, Flame, Home, LucideIcon, Palette, PlayCircle, Trophy, Tv, User } from 'lucide-react';

export interface NavigationItem {
  path: string;
  Icon: LucideIcon;
  label: string;
  description: string;
  passGated?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/',
    Icon: Home,
    label: 'Home',
    description: 'Return to homepage',
  },
  {
    path: '/discover',
    Icon: Flame,
    label: 'Discover',
    description: 'Explore trending content',
  },
  {
    path: '/nft-marketplace',
    Icon: Compass,
    label: 'NFT Marketplace',
    description: 'Browse NFT content',
    passGated: true,
  },
  {
    path: '/subscribed',
    Icon: PlayCircle,
    label: 'Subscriptions',
    description: 'View your subscribed content',
  },
  {
    path: '/channel',
    Icon: Tv,
    label: 'Channel',
    description: 'Manage your channel',
  },
  {
    path: '/profile',
    Icon: User,
    label: 'Profile',
    description: 'View your profile',
  },
  {
    path: '/creator-hub',
    Icon: Palette,
    label: 'Creator Hub',
    description: 'Access creator tools',
  },
  {
    path: '/leaderboard',
    Icon: Trophy,
    label: 'Leaderboard',
    description: 'See the top performers',
  },
];

export const isNavigationItemActive = (pathname: string, itemPath: string) => {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};
