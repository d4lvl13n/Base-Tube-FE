import { Channel } from '../../../../types/channel';

export interface EditChannelModalProps {
  channel: Channel;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Define FormFields independently to avoid type conflicts
export interface FormFields {
  name: string;
  handle: string;
  description: string;
  channel_image?: File | undefined;  // Match UpdateChannelData
  facebook_link: string;
  instagram_link: string;
  twitter_link: string;
}

export interface FormErrors {
  name?: string;
  handle?: string;
  description?: string;
  channel_image?: string;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
  submit?: string;
} 