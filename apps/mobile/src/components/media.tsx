import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Channel } from '@basetube/api';
import { theme } from '../theme';
import {
  channelAvatarUrl,
  formatCount,
  formatDuration,
  thumbnailUrl,
  timeAgo,
} from '../lib/format';

/**
 * Structural video shape the cards render. Accepts Video / FeaturedVideo /
 * DiscoveryVideo / pass videos — they all carry these fields (some optional).
 */
export interface AnyVideo {
  id: number | string;
  title: string;
  duration?: number | null;
  views_count?: number | null;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  createdAt?: string;
  created_at?: string;
  channel?: any;
}

function videoChannelName(v: AnyVideo): string {
  const ch: any = (v as any).channel;
  return ch?.name || ch?.handle || ch?.user?.username || 'Unknown channel';
}
function videoChannelAvatar(v: AnyVideo): string {
  const ch: any = (v as any).channel;
  if (ch?.owner?.profile_image_url) return ch.owner.profile_image_url;
  return channelAvatarUrl(ch);
}
function videoCreatedAt(v: AnyVideo): string {
  return (v as any).createdAt || (v as any).created_at || '';
}

/** Section header with an optional right-side action. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Large hero card for the featured slot. */
export function FeaturedCard({ video }: { video: AnyVideo }) {
  const router = useRouter();
  return (
    <Pressable style={styles.heroWrap} onPress={() => router.push(`/video/${video.id}`)}>
      <Image source={{ uri: thumbnailUrl(video as any) }} style={styles.heroImage} />
      <View style={styles.heroOverlay} />
      <View style={styles.heroMeta}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.heroSub}>
          {videoChannelName(video)} · {formatCount(video.views_count)} views
        </Text>
      </View>
      {video.duration ? (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Full-width feed card (Discover / Search / Channel lists). */
export function VideoCard({ video }: { video: AnyVideo }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/video/${video.id}`)}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: thumbnailUrl(video as any) }} style={styles.thumb} />
        {video.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Image source={{ uri: videoChannelAvatar(video) }} style={styles.cardAvatar} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {videoChannelName(video)}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {formatCount(video.views_count)} views{videoCreatedAt(video) ? ` · ${timeAgo(videoCreatedAt(video))}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Horizontal rail of compact video cards. */
export function VideoRail({ title, videos, action, onAction }: { title: string; videos: AnyVideo[]; action?: string; onAction?: () => void }) {
  const router = useRouter();
  if (!videos.length) return null;
  return (
    <View style={styles.railBlock}>
      <SectionHeader title={title} action={action} onAction={onAction} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {videos.map((v) => (
          <Pressable key={String(v.id)} style={styles.railItem} onPress={() => router.push(`/video/${v.id}`)}>
            <View style={styles.railThumbWrap}>
              <Image source={{ uri: thumbnailUrl(v as any) }} style={styles.railThumb} />
              {v.duration ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(v.duration)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.railTitle} numberOfLines={2}>{v.title}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{formatCount(v.views_count)} views</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Horizontal rail of creator avatars. */
export function CreatorRail({ title, channels, action, onAction }: { title: string; channels: Channel[]; action?: string; onAction?: () => void }) {
  const router = useRouter();
  if (!channels.length) return null;
  return (
    <View style={styles.railBlock}>
      <SectionHeader title={title} action={action} onAction={onAction} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {channels.map((c) => (
          <Pressable key={String(c.id)} style={styles.creatorItem} onPress={() => router.push(`/channel/${c.handle}`)}>
            <Image source={{ uri: channelAvatarUrl(c) }} style={styles.creatorAvatar} />
            <Text style={styles.creatorName} numberOfLines={1}>{c.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{formatCount(c.subscribers_count)} subs</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Full-width channel row (Subscriptions / search results). */
export function ChannelRow({ channel }: { channel: Channel }) {
  const router = useRouter();
  return (
    <Pressable style={styles.channelRow} onPress={() => router.push(`/channel/${channel.handle}`)}>
      <Image source={{ uri: channelAvatarUrl(channel) }} style={styles.rowAvatar} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{channel.name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          @{channel.handle} · {formatCount(channel.subscribers_count)} subscribers
        </Text>
      </View>
    </Pressable>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} />
      {label ? <Text style={styles.centerText}>{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.centerText}>{message || 'Something went wrong.'}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.centerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(3), marginTop: theme.spacing(2) },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  sectionAction: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },

  heroWrap: { borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 10 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroMeta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing(4) },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroSub: { color: '#e5e5e5', fontSize: 13, marginTop: theme.spacing(1) },
  featuredBadge: { alignSelf: 'flex-start', backgroundColor: theme.colors.accent, borderRadius: 6, paddingHorizontal: theme.spacing(2), paddingVertical: 2, marginBottom: theme.spacing(2) },
  featuredBadgeText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  card: { marginBottom: theme.spacing(6) },
  thumbWrap: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 9 },
  thumb: { width: '100%', height: '100%' },
  durationBadge: { position: 'absolute', right: theme.spacing(2), bottom: theme.spacing(2), backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardBody: { flexDirection: 'row', marginTop: theme.spacing(3), gap: theme.spacing(3) },
  cardAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt },
  cardText: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cardMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },

  railBlock: { marginTop: theme.spacing(6) },
  railContent: { gap: theme.spacing(3), paddingRight: theme.spacing(4) },
  railItem: { width: 220 },
  railThumbWrap: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 9 },
  railThumb: { width: '100%', height: '100%' },
  railTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: theme.spacing(2), lineHeight: 18 },

  creatorItem: { width: 96, alignItems: 'center' },
  creatorAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.surfaceAlt },
  creatorName: { color: theme.colors.text, fontSize: 13, fontWeight: '700', marginTop: theme.spacing(2), textAlign: 'center' },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), paddingVertical: theme.spacing(3) },
  rowAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.surfaceAlt },

  center: { padding: theme.spacing(10), alignItems: 'center', justifyContent: 'center', gap: theme.spacing(3) },
  centerText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' },
  retry: { borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing(5), paddingVertical: theme.spacing(2.5) },
  retryText: { color: theme.colors.text, fontWeight: '700' },
});
