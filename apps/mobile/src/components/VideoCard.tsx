import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { formatCount, formatDuration, resolveMediaUrl } from '../lib/format';

export interface VideoCardData {
  id: number | string;
  title: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  duration?: number;
  views_count?: number;
  channelName?: string;
}

export function VideoCard({ video, onPress }: { video: VideoCardData; onPress?: () => void }) {
  const thumb = resolveMediaUrl(video.thumbnail_url ?? video.thumbnail_path);
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.thumbWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
        {video.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {video.channelName ? `${video.channelName} · ` : ''}
        {formatCount(video.views_count)} views
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing(5) },
  thumbWrap: { position: 'relative', borderRadius: theme.radius.md, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.colors.surfaceAlt },
  thumbFallback: { backgroundColor: theme.colors.surfaceAlt },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginTop: theme.spacing(2) },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1) },
});
