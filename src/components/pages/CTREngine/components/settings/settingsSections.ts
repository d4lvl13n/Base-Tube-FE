// The AI Thumbnails settings hub: one route per section, /ai-thumbnails/settings/:section.
import type { LucideIcon } from 'lucide-react';
import { Palette, Image, ScanFace, SlidersHorizontal, Coins, CircleUser, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { thumbnailStudioApi } from '../../../../../api/thumbnailStudio';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';

export type SettingsSectionId = 'style' | 'logos' | 'face' | 'preferences' | 'credits' | 'subscription' | 'account';

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  /** One line under the section title. */
  intro: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'style',
    label: 'Channel style',
    icon: Palette,
    intro: 'Colours, font, logo, face, style image and rules. Pick a profile when you create; earlier projects keep their version.',
  },
  { id: 'logos', label: 'Logos', icon: Image, intro: 'The logo saved in each channel profile.' },
  { id: 'face', label: 'Face reference', icon: ScanFace, intro: 'Used when "Include my face" is on in Create.' },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: SlidersHorizontal,
    intro: 'Language, headline and content rules come from your channel profiles.',
  },
  { id: 'credits', label: 'Credits', icon: Coins, intro: 'Your balance, what each action costs, and your top-ups.' },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: CreditCard,
    intro: 'Your plan, its credits and the next invoice. Change or cancel it on Stripe.',
  },
  { id: 'account', label: 'Account', icon: CircleUser, intro: 'Your base.tube account.' },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'style';

export const settingsPath = (section: SettingsSectionId, search = '') =>
  `/ai-thumbnails/settings/${section}${search}`;

export const findSettingsSection = (id: string | undefined): SettingsSection | undefined =>
  SETTINGS_SECTIONS.find((section) => section.id === id);

/** The account's channel profiles: the same query (and cache) as the profile editor. */
export function useChannelProfiles(enabled = true) {
  const account = useStudioAccount();
  return useQuery({
    queryKey: ['thumbnail-studio', account, 'profiles'],
    queryFn: () => thumbnailStudioApi.profiles(),
    enabled: enabled && account !== 'anonymous',
    retry: false,
  });
}
