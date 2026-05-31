import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const inputRef = useRef<TextInput>(null);
  const videoRef = useRef<ExpoVideo>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const video = useQuery({ queryKey: ['video', id], queryFn: () => api.videos.getById(id), enabled: !!id });
  const liked = useQuery({ queryKey: ['like', id], queryFn: () => api.engagement.likeStatus(id), enabled: !!id });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => api.engagement.listComments(id), enabled: !!id });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.profile.me(), staleTime: 5 * 60_000, retry: false });

  useEffect(() => { if (id) api.engagement.trackView(id); }, [id]);

  // Optimistic like — flips the heart AND moves the count instantly, rolls back on error.
  const toggleLike = useMutation({
    mutationFn: () => api.engagement.toggleLike(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['like', id] });
      await queryClient.cancelQueries({ queryKey: ['video', id] });
      const prevLiked = queryClient.getQueryData<boolean>(['like', id]) ?? false;
      const prevVideo = queryClient.getQueryData<any>(['video', id]);
      const nextLiked = !prevLiked;
      queryClient.setQueryData(['like', id], nextLiked);
      queryClient.setQueryData(['video', id], (old: any) =>
        old
          ? { ...old, likes_count: Math.max(0, (old.likes_count ?? 0) + (nextLiked ? 1 : -1)) }
          : old
      );
      return { prevLiked, prevVideo };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      queryClient.setQueryData(['like', id], ctx.prevLiked);
      if (ctx.prevVideo) queryClient.setQueryData(['video', id], ctx.prevVideo);
    },
    onSuccess: (resp: any) => {
      // Use the toggle response's authoritative count when present; otherwise keep
      // the optimistic value. Do NOT refetch the video — its denormalized
      // likes_count lags and would clobber the count back to 0.
      const c = resp?.data?.likesCount ?? resp?.data?.likes_count;
      if (typeof c === 'number') {
        queryClient.setQueryData(['video', id], (old: any) => (old ? { ...old, likes_count: c } : old));
      }
      if (typeof resp?.data?.isLiked === 'boolean') {
        queryClient.setQueryData(['like', id], resp.data.isLiked);
      } else if (typeof resp?.data?.liked === 'boolean') {
        queryClient.setQueryData(['like', id], resp.data.liked);
      }
    },
    // Only reconcile the boolean like-state; the count is handled above.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['like', id] }),
  });
  const addComment = useMutation({
    mutationFn: (content: string) => api.engagement.addComment(id, content),
    onSuccess: () => { setComment(''); queryClient.invalidateQueries({ queryKey: ['comments', id] }); },
  });
  const editComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => api.engagement.updateComment(commentId, content),
    onSuccess: () => { setComment(''); setEditingId(null); queryClient.invalidateQueries({ queryKey: ['comments', id] }); },
  });
  const removeComment = useMutation({
    mutationFn: (commentId: number) => api.engagement.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', id] }),
  });

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    if (editingId) editComment.mutate({ commentId: editingId, content: text });
    else addComment.mutate(text);
  };
  const startEdit = (commentId: number, content: string) => {
    setEditingId(commentId);
    setComment(content);
    inputRef.current?.focus();
  };
  const confirmDelete = (commentId: number) => {
    Alert.alert('Delete comment', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeComment.mutate(commentId) },
    ]);
  };

  // Subscribe from the video page (parity with web). Optimistic local state.
  const [subOverride, setSubOverride] = useState<boolean | null>(null);

  const onShare = async () => {
    const url = `https://base.tube/video/${id}`;
    const title = v?.title ?? 'Watch on BaseTube';
    try {
      // iOS shows a rich URL chip when `url` is passed; Android only reads `message`.
      const res = await Share.share(
        Platform.OS === 'ios' ? { url, message: title, title } : { message: `${title}\n${url}`, title }
      );
      if (res.action === Share.sharedAction) api.engagement.share(id, 'other').catch(() => {});
    } catch {
      /* user dismissed */
    }
  };

  const subscribeMut = useMutation({
    mutationFn: () => {
      const subbed = subOverride ?? !!channel?.isSubscribed;
      return subbed ? api.channels.unsubscribe(channel.handle) : api.channels.subscribe(channel.handle);
    },
    // Optimistic: flip the button AND move the subscriber count instantly.
    onMutate: async () => {
      const wasSubbed = subOverride ?? !!channel?.isSubscribed;
      const nextSubbed = !wasSubbed;
      setSubOverride(nextSubbed);
      await queryClient.cancelQueries({ queryKey: ['video', id] });
      const prevVideo = queryClient.getQueryData<any>(['video', id]);
      queryClient.setQueryData(['video', id], (old: any) =>
        old?.channel
          ? {
              ...old,
              channel: {
                ...old.channel,
                isSubscribed: nextSubbed,
                subscribers_count: Math.max(0, (old.channel.subscribers_count ?? 0) + (nextSubbed ? 1 : -1)),
              },
            }
          : old
      );
      return { prevVideo, wasSubbed };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      setSubOverride(ctx.wasSubbed);
      if (ctx.prevVideo) queryClient.setQueryData(['video', id], ctx.prevVideo);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['video', id] }),
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
            <ExpoVideo ref={videoRef} source={{ uri: url }} style={styles.video} useNativeControls shouldPlay resizeMode={ResizeMode.CONTAIN} posterSource={{ uri: thumbnailUrl(v) }} usePoster />
          ) : (
            <Image source={{ uri: thumbnailUrl(v) }} style={styles.video} resizeMode="cover" />
          )}
          <AccentHairline style={styles.playerHairline} />
          {url ? (
            <Pressable
              onPress={() => videoRef.current?.presentFullscreenPlayer()}
              hitSlop={8}
              style={styles.fsBtn}
            >
              <Ionicons name="expand" size={17} color="#fff" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{v.title}</Text>
          <Text style={styles.meta}>{formatCount(v.views_count)} views{v.createdAt ? `  ·  ${timeAgo(v.createdAt)}` : ''}</Text>

          <View style={styles.actions}>
            <ActionChip icon={liked.data ? 'heart' : 'heart-outline'} label={formatCount(v.likes_count)} active={!!liked.data} onPress={() => toggleLike.mutate()} />
            <ActionChip icon="chatbubble-outline" label={formatCount(comments.data?.totalComments ?? v.comment_count ?? 0)} onPress={() => inputRef.current?.focus()} />
            <ActionChip icon="share-social-outline" label="Share" onPress={onShare} />
          </View>

          {channel ? (
            <Card hairline padded style={styles.creatorCard}>
              <View style={styles.creatorRow}>
                <Pressable style={styles.creatorTap} onPress={() => router.push(`/channel/${channel.handle}`)}>
                  <View style={styles.creatorRing}>
                    <Image source={{ uri: channelAvatarUrl(channel) }} style={styles.creatorAvatar} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.creatorName} numberOfLines={1}>{channel.name}</Text>
                    <Text style={styles.metaFaint}>{formatCount(channel.subscribers_count)} subscribers</Text>
                  </View>
                </Pressable>
                {(() => {
                  const subscribed = subOverride ?? !!channel.isSubscribed;
                  return (
                    <Pressable
                      onPress={() => subscribeMut.mutate()}
                      style={[styles.subBtn, subscribed ? styles.subBtnOn : styles.subBtnOff]}
                    >
                      <Text style={[styles.subText, subscribed ? styles.subTextOn : styles.subTextOff]}>
                        {subscribed ? 'Subscribed' : 'Subscribe'}
                      </Text>
                    </Pressable>
                  );
                })()}
              </View>
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
              ref={inputRef}
              value={comment}
              onChangeText={setComment}
              placeholder={editingId ? 'Edit your comment…' : 'Add a comment…'}
              placeholderTextColor={theme.colors.textFaint}
              style={styles.commentInput}
              multiline
            />
            <Pressable
              disabled={!comment.trim() || addComment.isPending || editComment.isPending}
              onPress={submitComment}
              style={[styles.postBtn, (!comment.trim() || addComment.isPending || editComment.isPending) && styles.postBtnDim]}
            >
              <Text style={styles.postBtnText}>{editingId ? 'Save' : 'Post'}</Text>
            </Pressable>
          </View>
          {editingId ? (
            <Pressable onPress={() => { setEditingId(null); setComment(''); }} style={styles.cancelEdit}>
              <Text style={styles.cancelEditText}>Cancel edit</Text>
            </Pressable>
          ) : null}

          {comments.isLoading ? (
            <LoadingState />
          ) : (
            (comments.data?.comments ?? []).map((c) => {
              const own = me.data?.id != null && String(c.user?.id) === String(me.data.id);
              return (
                <View key={`c-${c.id}`} style={styles.comment}>
                  <Image source={{ uri: imageUrl(c.user?.profile_image_url) }} style={styles.commentAvatar} />
                  <View style={styles.flex}>
                    <Text style={styles.commentAuthor}>{c.user?.username || 'user'} <Text style={styles.commentTime}>· {timeAgo(c.createdAt)}</Text></Text>
                    <Text style={styles.commentBody}>{c.content}</Text>
                    {own ? (
                      <View style={styles.commentActions}>
                        <Pressable onPress={() => startEdit(c.id, c.content)} hitSlop={6}><Text style={styles.commentAction}>Edit</Text></Pressable>
                        <Pressable onPress={() => confirmDelete(c.id)} hitSlop={6}><Text style={[styles.commentAction, styles.commentDelete]}>Delete</Text></Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
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
  fsBtn: { position: 'absolute', top: theme.spacing(2.5), right: theme.spacing(2.5), width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.28)' },
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
  creatorTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) },
  subBtn: { borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing(4.5), paddingVertical: theme.spacing(2.5) },
  subBtnOff: { backgroundColor: theme.colors.accent },
  subBtnOn: { backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderStrong },
  subText: { fontWeight: '800', fontSize: 13 },
  subTextOff: { color: '#1a0c00' },
  subTextOn: { color: theme.colors.text },
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
  commentActions: { flexDirection: 'row', gap: theme.spacing(4), marginTop: theme.spacing(2) },
  commentAction: { color: theme.colors.textMuted, fontSize: 12.5, fontWeight: '700' },
  commentDelete: { color: theme.colors.danger },
  cancelEdit: { alignSelf: 'flex-start', marginTop: -theme.spacing(2), marginBottom: theme.spacing(4) },
  cancelEditText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
