// src/components/pages/CTREngine/components/aiThumbnailsNav.ts
import type { LucideIcon } from 'lucide-react';
import { Sparkles, BarChart2, History, Images, Settings } from 'lucide-react';

export interface AIThumbnailsNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  description: string;
  requiresAuth: boolean;
}

export const AI_THUMBNAILS_NAV_ITEMS: AIThumbnailsNavItem[] = [
  {
    path: '/ai-thumbnails/generate',
    label: 'Create',
    icon: Sparkles,
    description: 'Generate thumbnails',
    requiresAuth: false,
  },
  {
    path: '/ai-thumbnails/audit',
    label: 'Audit',
    icon: BarChart2,
    description: 'Analyze thumbnails',
    requiresAuth: false,
  },
  {
    path: '/ai-thumbnails/history',
    label: 'History',
    icon: History,
    description: 'Past audits',
    requiresAuth: true,
  },
  {
    path: '/ai-thumbnails/gallery',
    label: 'My Gallery',
    icon: Images,
    description: 'Your thumbnails',
    requiresAuth: true,
  },
  {
    path: '/ai-thumbnails/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Preferences',
    requiresAuth: true,
  },
];


