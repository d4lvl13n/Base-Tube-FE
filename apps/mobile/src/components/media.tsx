import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { Channel } from '@basetube/api';
import { theme } from '../theme';
import { AccentHairline, Pill, Scrim } from './primitives';
import {
  channelAvatarUrl,
  formatCount,
  formatDuration,
  thumbnailUrl,
  timeAgo,
} from '../lib/format';

/** Structural video shape the cards render (Video / FeaturedVideo / DiscoveryVideo / SearchResult). */
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
  const ch: any = v.channel;
  return ch?.name || ch?.handle || ch?.user?.username || 'BaseTube creator';
}
function videoChannelAvatar(v: AnyVideo): string {
  const ch: any = v.channel;
  if (ch?.owner?.profile_image_url) return ch.owner.profile_image_url;
  return channelAvatarUrl(ch);
}
function videoCreatedAt(v: AnyVideo): string {
  return v.createdAt || v.created_at || '';
}

function DurationPill({ seconds }: { seconds?: number | null }) {
  if (!seconds) return null;
  return (
    <View style={styles.durationPill}>
      <Text style={styles.durationText}>{formatDuration(seconds)}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionTick} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Cinematic hero card for the featured slot. */
export function FeaturedCard({ video }: { video: AnyVideo }) {
  const router = useRouter();
  return (
    <Pressable style={({ pressed }) => [styles.hero, pressed && styles.pressed]} onPress={() => router.push(`/video/${video.id}`)}>
      <Image transition={150} source={{ uri: thumbnailUrl(video) }} style={StyleSheet.absoluteFill} />
      <Scrim />
      <AccentHairline style={styles.heroHairline} />
      <View style={styles.heroMeta}>
        <Pill label="Featured" tone="accent" />
        <Text style={styles.heroTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.heroSub} numberOfLines={1}>
          {videoChannelName(video)}  ·  {formatCount(video.views_count)} views
        </Text>
      </View>
      <View style={styles.heroDuration}><DurationPill seconds={video.duration} /></View>
    </Pressable>
  );
}

/** Full-width feed card. */
export function VideoCard({ video }: { video: AnyVideo }) {
  const router = useRouter();
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => router.push(`/video/${video.id}`)}>
      <View style={styles.thumbWrap}>
        <Image transition={150} source={{ uri: thumbnailUrl(video) }} style={styles.thumb} />
        <View style={styles.durationAnchor}><DurationPill seconds={video.duration} /></View>
      </View>
      <View style={styles.cardBody}>
        <Image transition={150} source={{ uri: videoChannelAvatar(video) }} style={styles.cardAvatar} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>{videoChannelName(video)}</Text>
          <Text style={styles.cardMetaFaint} numberOfLines={1}>
            {formatCount(video.views_count)} views{videoCreatedAt(video) ? `  ·  ${timeAgo(videoCreatedAt(video))}` : ''}
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
          <Pressable key={String(v.id)} style={({ pressed }) => [styles.railItem, pressed && styles.pressed]} onPress={() => router.push(`/video/${v.id}`)}>
            <View style={styles.railThumbWrap}>
              <Image transition={150} source={{ uri: thumbnailUrl(v) }} style={styles.railThumb} />
              <View style={styles.durationAnchor}><DurationPill seconds={v.duration} /></View>
            </View>
            <Text style={styles.railTitle} numberOfLines={2}>{v.title}</Text>
            <Text style={styles.cardMetaFaint} numberOfLines={1}>{formatCount(v.views_count)} views</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Horizontal rail of creator avatars with frost ring. */
export function CreatorRail({ title, channels, action, onAction }: { title: string; channels: Channel[]; action?: string; onAction?: () => void }) {
  const router = useRouter();
  if (!channels.length) return null;
  return (
    <View style={styles.railBlock}>
      <SectionHeader title={title} action={action} onAction={onAction} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {channels.map((c) => (
          <Pressable key={String(c.id)} style={({ pressed }) => [styles.creatorItem, pressed && styles.pressed]} onPress={() => router.push(`/channel/${c.handle}`)}>
            <View style={styles.creatorRing}>
              <Image transition={150} source={{ uri: channelAvatarUrl(c) }} style={styles.creatorAvatar} />
            </View>
            <Text style={styles.creatorName} numberOfLines={1}>{c.name}</Text>
            <Text style={styles.cardMetaFaint} numberOfLines={1}>{formatCount(c.subscribers_count)} subs</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Full-width channel row. */
export function ChannelRow({ channel }: { channel: Channel }) {
  const router = useRouter();
  return (
    <Pressable style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]} onPress={() => router.push(`/channel/${channel.handle}`)}>
      <View style={styles.rowRing}>
        <Image transition={150} source={{ uri: channelAvatarUrl(channel) }} style={styles.rowAvatar} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{channel.name}</Text>
        <Text style={styles.cardMetaFaint} numberOfLines={1}>
          @{channel.handle}  ·  {formatCount(channel.subscribers_count)} subscribers
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
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(3.5) },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2.5) },
  sectionTick: { width: 3, height: 18, borderRadius: 2, backgroundColor: theme.colors.accent },
  sectionTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionAction: { color: theme.colors.accentBright, fontWeight: '700', fontSize: 13 },

  hero: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    aspectRatio: 16 / 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    ...theme.shadow.card,
  },
  heroHairline: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  heroMeta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing(5), gap: theme.spacing(2) },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '500' },
  heroDuration: { position: 'absolute', top: theme.spacing(4), right: theme.spacing(4) },

  card: { marginBottom: theme.spacing(6) },
  thumbWrap: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    aspectRatio: 16 / 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  thumb: { width: '100%', height: '100%' },
  durationAnchor: { position: 'absolute', right: theme.spacing(2.5), bottom: theme.spacing(2.5) },
  durationPill: { backgroundColor: 'rgba(0,0,0,0.78)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cardBody: { flexDirection: 'row', marginTop: theme.spacing(3.5), gap: theme.spacing(3) },
  cardAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  cardText: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: 15.5, fontWeight: '700', lineHeight: 21, letterSpacing: -0.2 },
  cardMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3, fontWeight: '500' },
  cardMetaFaint: { color: theme.colors.textFaint, fontSize: 12.5, marginTop: 2 },

  railBlock: { marginTop: theme.spacing(7) },
  railContent: { gap: theme.spacing(3.5), paddingRight: theme.spacing(4) },
  railItem: { width: 232 },
  railThumbWrap: { borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 9, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  railThumb: { width: '100%', height: '100%' },
  railTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: theme.spacing(2.5), lineHeight: 18, letterSpacing: -0.2 },

  creatorItem: { width: 100, alignItems: 'center' },
  creatorRing: { width: 80, height: 80, borderRadius: 40, padding: 2, borderWidth: 1.5, borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  creatorAvatar: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: theme.colors.surfaceAlt },
  creatorName: { color: theme.colors.text, fontSize: 13, fontWeight: '700', marginTop: theme.spacing(2.5), textAlign: 'center' },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3.5), paddingVertical: theme.spacing(3) },
  rowRing: { width: 56, height: 56, borderRadius: 28, padding: 2, borderWidth: 1.5, borderColor: theme.colors.borderStrong },
  rowAvatar: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: theme.colors.surfaceAlt },

  center: { padding: theme.spacing(10), alignItems: 'center', justifyContent: 'center', gap: theme.spacing(3) },
  centerText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retry: { borderColor: theme.colors.borderStrong, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing(6), paddingVertical: theme.spacing(2.5) },
  retryText: { color: theme.colors.text, fontWeight: '700' },
});
