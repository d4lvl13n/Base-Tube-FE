import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { formatCount, formatDuration, resolveMediaUrl } from '../../src/lib/format';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const video = useQuery({
    queryKey: ['video', id],
    queryFn: () => api.videos.getById(id),
    enabled: !!id,
  });

  if (video.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (video.isError || !video.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Couldn't load this video.</Text>
      </View>
    );
  }

  const v = video.data;
  const thumb = resolveMediaUrl(v.thumbnail_url ?? v.thumbnail_path);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.player}>
        {thumb ? <Image source={{ uri: thumb }} style={styles.poster} resizeMode="cover" /> : null}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={64} color="#fff" />
        </View>
        {v.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(v.duration)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{v.title}</Text>
      <Text style={styles.meta}>
        {v.channel?.name ? `${v.channel.name} · ` : ''}
        {formatCount(v.views_count)} views · {formatCount(v.likes_count)} likes
      </Text>

      <View style={styles.divider} />

      {v.description ? <Text style={styles.description}>{v.description}</Text> : null}

      <Text style={styles.note}>
        Secure playback (signed-url / play-token by storage tier) and the native
        player are wired in phase 3.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  muted: { color: theme.colors.textMuted, fontSize: 15 },
  player: {
    position: 'relative',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  poster: { width: '100%', aspectRatio: 16 / 9 },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
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
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: theme.spacing(4) },
  meta: { color: theme.colors.textMuted, fontSize: 14, marginTop: theme.spacing(2) },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(4) },
  description: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  note: { color: theme.colors.accent, fontSize: 13, marginTop: theme.spacing(6) },
});
