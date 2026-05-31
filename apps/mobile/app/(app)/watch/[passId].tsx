import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ResizeMode, Video as ExpoVideo } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { PassVideo } from '@basetube/api';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { Button, Heading, Subtle } from '../../../src/components/ui';
import { ErrorState, LoadingState } from '../../../src/components/media';
import { formatDuration, thumbnailUrl } from '../../../src/lib/format';

export default function WatchScreen() {
  const { passId } = useLocalSearchParams<{ passId: string }>();
  const router = useRouter();
  const [playerUri, setPlayerUri] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  const pass = useQuery({ queryKey: ['pass', passId], queryFn: () => api.passes.getById(passId), enabled: !!passId });
  const p = pass.data;

  const playVideo = async (video: PassVideo) => {
    setPlayError(null);
    setLoadingVideoId(video.id);
    try {
      const data = await api.passes.getVideoPlaybackUrl(video.id, video.storage_tier ?? 'external');
      if (data.platform === 'hosted' && data.playback_url) {
        setPlayerUri(data.playback_url);
        setActiveId(video.id);
      } else {
        // External (YouTube/Vimeo/etc.) — open the playback URL in the browser.
        await WebBrowser.openBrowserAsync(data.embed_url || data.playback_url);
      }
    } catch (e: any) {
      const code = e?.response?.data?.error?.code;
      setPlayError(code === 'PLAY_TOKEN_RATE_LIMIT_EXCEEDED' ? 'Too many plays right now — try again shortly.' : 'Could not start playback.');
    } finally {
      setLoadingVideoId(null);
    }
  };

  if (pass.isLoading) return (<><Stack.Screen options={{ title: 'Watch' }} /><LoadingState label="Loading…" /></>);
  if (pass.isError || !p) return (<><Stack.Screen options={{ title: 'Watch' }} /><ErrorState onRetry={() => pass.refetch()} /></>);

  // Gate: no access → locked state.
  if (!p.has_access) {
    return (
      <>
        <Stack.Screen options={{ title: p.title }} />
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={56} color={theme.colors.textMuted} />
          <Heading>Pass required</Heading>
          <Subtle>Get the “{p.title}” pass to watch this content.</Subtle>
          <View style={styles.lockedCta}>
            <Button label="View pass" onPress={() => router.replace(`/p/${p.slug || p.id}`)} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: p.title }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.player}>
          {playerUri ? (
            <ExpoVideo source={{ uri: playerUri }} style={styles.video} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay />
          ) : (
            <View style={styles.playerPlaceholder}>
              <Ionicons name="play-circle-outline" size={56} color={theme.colors.textMuted} />
              <Text style={styles.placeholderText}>Select an episode to play</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{p.title}</Text>
          {playError ? <Text style={styles.error}>{playError}</Text> : null}
          <Text style={styles.sectionTitle}>Episodes</Text>
          {(p.videos ?? []).map((v) => {
            const active = v.id === activeId;
            const isLoading = v.id === loadingVideoId;
            return (
              <Pressable key={`w-${v.id}`} style={[styles.episode, active && styles.episodeActive]} onPress={() => playVideo(v)}>
                <Image transition={150} source={{ uri: thumbnailUrl({ thumbnail_url: v.thumbnail_url }) }} style={styles.epThumb} />
                <View style={styles.flex}>
                  <Text style={styles.epTitle} numberOfLines={2}>{v.title || 'Video'}</Text>
                  <Text style={styles.epMeta}>
                    {v.storage_tier === 'external' ? 'Opens in browser' : 'Stream'}{v.duration ? ` · ${formatDuration(v.duration)}` : ''}
                  </Text>
                </View>
                <Ionicons name={isLoading ? 'hourglass-outline' : active ? 'pause-circle' : 'play-circle'} size={26} color={theme.colors.accent} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: theme.spacing(12) },
  player: { width: '100%', backgroundColor: '#000', aspectRatio: 16 / 9 },
  video: { width: '100%', height: '100%' },
  playerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing(2) },
  placeholderText: { color: theme.colors.textMuted, fontSize: 14 },
  body: { padding: theme.spacing(4) },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  error: { color: '#f87171', fontSize: 13, marginTop: theme.spacing(2) },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: theme.spacing(5), marginBottom: theme.spacing(3) },
  episode: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), paddingVertical: theme.spacing(2.5), paddingHorizontal: theme.spacing(2), borderRadius: theme.radius.md },
  episodeActive: { backgroundColor: theme.colors.surface },
  epThumb: { width: 96, height: 54, borderRadius: 8, backgroundColor: theme.colors.surface },
  epTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  epMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  locked: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(8), gap: theme.spacing(3) },
  lockedCta: { alignSelf: 'stretch', marginTop: theme.spacing(4) },
});
