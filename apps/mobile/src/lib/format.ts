import { API_BASE_URL } from './client';

const DEFAULT_THUMB = 'https://base.tube/assets/default-thumbnail.jpg';
const DEFAULT_AVATAR = 'https://base.tube/assets/default-avatar.jpg';

type ThumbSource = {
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
};

type ChannelImageSource = {
  channel_image_url?: string | null;
  channel_image_path?: string | null;
  ownerProfileImage?: string | null;
};

function withBase(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** Mirrors web getThumbnailUrl: prefer absolute url, else resolve path against API base. */
export function thumbnailUrl(video?: ThumbSource | null): string {
  if (!video) return DEFAULT_THUMB;
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.thumbnail_path) return withBase(video.thumbnail_path);
  return DEFAULT_THUMB;
}

/** Mirrors web getChannelImageUrl (cover/banner image). */
export function channelImageUrl(channel?: ChannelImageSource | null): string {
  if (!channel) return DEFAULT_THUMB;
  if (channel.channel_image_url) return channel.channel_image_url;
  if (channel.channel_image_path) return withBase(channel.channel_image_path);
  return DEFAULT_THUMB;
}

/** Mirrors web getChannelAvatarUrl (owner avatar, falling back to channel image). */
export function channelAvatarUrl(channel?: ChannelImageSource | null): string {
  if (!channel) return DEFAULT_AVATAR;
  if (channel.ownerProfileImage) return withBase(channel.ownerProfileImage);
  if (channel.channel_image_url || channel.channel_image_path) return channelImageUrl(channel);
  return DEFAULT_AVATAR;
}

/** Resolve any backend-relative or absolute image path against the API base. */
export function imageUrl(path?: string | null, fallback = DEFAULT_AVATAR): string {
  if (!path) return fallback;
  return withBase(path);
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Compact counts: 1.2K, 3.4M. Mirrors web formatCompact. */
export function formatCount(value?: number | null): string {
  const v = value || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function timeAgo(input?: string | null): string {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let value = secs;
  let unit = 'second';
  for (const [factor, name] of units) {
    if (value < factor) {
      unit = name;
      break;
    }
    value = Math.floor(value / factor);
    unit = name;
  }
  if (unit === 'second' && value < 30) return 'just now';
  const rounded = Math.max(1, value);
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`;
}

/** USD/EUR price from cents, mirroring web formatPrice. */
export function formatPrice(priceCents?: number | null, currency = 'USD', formatted?: string | null): string {
  if (formatted) return formatted;
  const amount = (priceCents || 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
