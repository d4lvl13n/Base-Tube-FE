import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResizeMode, Video as ExpoVideo } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { AccentHairline, Card, GlassCircleButton } from '../../../src/components/primitives';
import { ErrorState, LoadingState } from '../../../src/components/media';
import { channelAvatarUrl, formatCount, imageUrl, thumbnailUrl, timeAgo } from '../../../src/lib/format';

function playableUrl(video: any): string | null {
  if (video?.video_url) return video.video_url;
  const urls = video?.video_urls;
  if (urls && typeof urls === 'object') {
    // Prefer a balanced quality; fall back through the available renditions.
    const preferred = urls['720p'] || urls['480p'] || urls['1080p'] || urls['360p'];
    if (typeof preferred === 'string' && preferred) return preferred;
    const first = Object.values(urls).find((u) => typeof u === 'string' && u);
    if (first) return first as string;
  }
  if (video?.video_path) return `${process.env.EXPO_PUBLIC_API_URL ?? ''}/${video.video_path}`;
  return null;
}

function ActionChip({ icon, label, active, onPress }: { icon: any; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={active ? theme.colors.accent : theme.colors.text} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  const video = useQuery({ queryKey: ['video', id], queryFn: () => api.videos.getById(id), enabled: !!id });
  const liked = useQuery({ queryKey: ['like', id], queryFn: () => api.engagement.likeStatus(id), enabled: !!id });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => api.engagement.listComments(id), enabled: !!id });

  useEffect(() => { if (id) api.engagement.trackView(id); }, [id]);

  const toggleLike = useMutation({
    mutationFn: () => api.engagement.toggleLike(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', id] });
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    },
  });
  const addComment = useMutation({
    mutationFn: (content: string) => api.engagement.addComment(id, content),
    onSuccess: () => { setComment(''); queryClient.invalidateQueries({ queryKey: ['comments', id] }); },
  });

  const v: any = video.data;
  const url = useMemo(() => playableUrl(v), [v]);
  const channel = v?.channel;

  const backButton = (
    <GlassCircleButton icon="chevron-back" onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 6 }]} />
  );

  if (video.isLoading) return (<><Stack.Screen options={{ headerShown: false }} /><View style={styles.bg}>{backButton}<LoadingState label="Loading video…" /></View></>);
  if (video.isError || !v) return (<><Stack.Screen options={{ headerShown: false }} /><View style={styles.bg}>{backButton}<ErrorState onRetry={() => video.refetch()} /></View></>);

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* status-bar strip so the clock/wifi sit on black, not over the player */}
        <View style={[styles.statusStrip, { height: insets.top }]} />
        <View style={styles.player}>
          {url ? (
            <ExpoVideo source={{ uri: url }} style={styles.video} useNativeControls shouldPlay resizeMode={ResizeMode.CONTAIN} posterSource={{ uri: thumbnailUrl(v) }} usePoster />
          ) : (
            <Image source={{ uri: thumbnailUrl(v) }} style={styles.video} resizeMode="cover" />
          )}
          <AccentHairline style={styles.playerHairline} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{v.title}</Text>
          <Text style={styles.meta}>{formatCount(v.views_count)} views{v.createdAt ? `  ·  ${timeAgo(v.createdAt)}` : ''}</Text>

          <View style={styles.actions}>
            <ActionChip icon={liked.data ? 'heart' : 'heart-outline'} label={formatCount(v.likes_count)} active={!!liked.data} onPress={() => toggleLike.mutate()} />
            <ActionChip icon="chatbubble-outline" label={formatCount(comments.data?.totalComments ?? v.comment_count ?? 0)} onPress={() => {}} />
            <ActionChip icon="share-social-outline" label="Share" onPress={() => api.engagement.share(id, 'other')} />
          </View>

          {channel ? (
            <Card hairline padded style={styles.creatorCard}>
              <Pressable style={styles.creatorRow} onPress={() => router.push(`/channel/${channel.handle}`)}>
                <View style={styles.creatorRing}>
                  <Image source={{ uri: channelAvatarUrl(channel) }} style={styles.creatorAvatar} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.creatorName}>{channel.name}</Text>
                  <Text style={styles.metaFaint}>{formatCount(channel.subscribers_count)} subscribers</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </Card>
          ) : null}

          {v.description ? (
            <Pressable onPress={() => setDescExpanded((e) => !e)}>
              <Card padded style={styles.desc}>
                <Text style={styles.descText} numberOfLines={descExpanded ? undefined : 3}>{v.description}</Text>
                <Text style={styles.descToggle}>{descExpanded ? 'Show less' : 'Show more'}</Text>
              </Card>
            </Pressable>
          ) : null}

          <Text style={styles.commentsHeading}>Comments{comments.data ? `  ·  ${formatCount(comments.data.totalComments)}` : ''}</Text>

          <View style={styles.addRow}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment…"
              placeholderTextColor={theme.colors.textFaint}
              style={styles.commentInput}
              multiline
            />
            <Pressable
              disabled={!comment.trim() || addComment.isPending}
              onPress={() => addComment.mutate(comment.trim())}
              style={[styles.postBtn, (!comment.trim() || addComment.isPending) && styles.postBtnDim]}
            >
              <Text style={styles.postBtnText}>Post</Text>
            </Pressable>
          </View>

          {comments.isLoading ? (
            <LoadingState />
          ) : (
            (comments.data?.comments ?? []).map((c) => (
              <View key={`c-${c.id}`} style={styles.comment}>
                <Image source={{ uri: imageUrl(c.user?.profile_image_url) }} style={styles.commentAvatar} />
                <View style={styles.flex}>
                  <Text style={styles.commentAuthor}>{c.user?.username || 'user'} <Text style={styles.commentTime}>· {timeAgo(c.createdAt)}</Text></Text>
                  <Text style={styles.commentBody}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      {backButton}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.background },
  statusStrip: { backgroundColor: '#000', width: '100%' },
  backBtn: { position: 'absolute', left: theme.spacing(4), zIndex: 20 },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  content: { paddingBottom: theme.spacing(14) },
  player: { width: '100%', backgroundColor: '#000', aspectRatio: 16 / 9 },
  video: { width: '100%', height: '100%' },
  playerHairline: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  body: { padding: theme.spacing(4) },
  title: { color: theme.colors.text, fontSize: 19, fontWeight: '800', lineHeight: 25, letterSpacing: -0.4 },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1.5), fontWeight: '500' },
  metaFaint: { color: theme.colors.textFaint, fontSize: 12.5, marginTop: 2 },

  actions: { flexDirection: 'row', gap: theme.spacing(2.5), marginTop: theme.spacing(4) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(2.5) },
  chipActive: { borderColor: 'rgba(250,117,23,0.5)', backgroundColor: theme.colors.accentSoft },
  chipText: { color: theme.colors.text, fontWeight: '700', fontSize: 13.5 },
  chipTextActive: { color: theme.colors.accentBright },

  creatorCard: { marginTop: theme.spacing(5) },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  creatorRing: { width: 48, height: 48, borderRadius: 24, padding: 2, borderWidth: 1.5, borderColor: theme.colors.borderStrong },
  creatorAvatar: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: theme.colors.surfaceAlt },
  creatorName: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },

  desc: { marginTop: theme.spacing(4) },
  descText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 },
  descToggle: { color: theme.colors.accentBright, fontSize: 13, fontWeight: '700', marginTop: theme.spacing(2) },

  commentsHeading: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: theme.spacing(7), marginBottom: theme.spacing(3) },
  addRow: { flexDirection: 'row', gap: theme.spacing(2), alignItems: 'flex-end', marginBottom: theme.spacing(5) },
  commentInput: { flex: 1, color: theme.colors.text, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, paddingHorizontal: theme.spacing(3.5), paddingVertical: theme.spacing(3), maxHeight: 110, fontSize: 15 },
  postBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing(4.5), paddingVertical: theme.spacing(3.5) },
  postBtnDim: { opacity: 0.45 },
  postBtnText: { color: '#1a0c00', fontWeight: '800' },
  comment: { flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(4.5) },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  commentAuthor: { color: theme.colors.text, fontWeight: '700', fontSize: 13.5 },
  commentTime: { color: theme.colors.textFaint, fontWeight: '400' },
  commentBody: { color: theme.colors.text, fontSize: 14, marginTop: 3, lineHeight: 20 },
});
