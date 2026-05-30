import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ResizeMode, Video as ExpoVideo } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { ErrorState, LoadingState } from '../../../src/components/media';
import { channelAvatarUrl, formatCount, imageUrl, thumbnailUrl, timeAgo } from '../../../src/lib/format';

function playableUrl(video: any): string | null {
  if (video?.video_url) return video.video_url;
  const urls = video?.video_urls;
  if (urls && typeof urls === 'object') {
    const first = Object.values(urls).find((u) => typeof u === 'string' && u);
    if (first) return first as string;
  }
  return null;
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  const video = useQuery({ queryKey: ['video', id], queryFn: () => api.videos.getById(id), enabled: !!id });
  const liked = useQuery({ queryKey: ['like', id], queryFn: () => api.engagement.likeStatus(id), enabled: !!id });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => api.engagement.listComments(id), enabled: !!id });

  useEffect(() => {
    if (id) api.engagement.trackView(id);
  }, [id]);

  const toggleLike = useMutation({
    mutationFn: () => api.engagement.toggleLike(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', id] });
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    },
  });

  const addComment = useMutation({
    mutationFn: (content: string) => api.engagement.addComment(id, content),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  const v: any = video.data;
  const url = useMemo(() => playableUrl(v), [v]);
  const channel = v?.channel;

  if (video.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Video' }} />
        <LoadingState label="Loading video…" />
      </>
    );
  }
  if (video.isError || !v) {
    return (
      <>
        <Stack.Screen options={{ title: 'Video' }} />
        <ErrorState onRetry={() => video.refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackTitleVisible: false }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.player}>
          {url ? (
            <ExpoVideo
              source={{ uri: url }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              posterSource={{ uri: thumbnailUrl(v) }}
            />
          ) : (
            <Image source={{ uri: thumbnailUrl(v) }} style={styles.video} />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{v.title}</Text>
          <Text style={styles.meta}>
            {formatCount(v.views_count)} views{v.createdAt ? ` · ${timeAgo(v.createdAt)}` : ''}
          </Text>

          {/* Action row */}
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => toggleLike.mutate()}>
              <Ionicons name={liked.data ? 'heart' : 'heart-outline'} size={22} color={liked.data ? theme.colors.accent : theme.colors.text} />
              <Text style={styles.actionText}>{formatCount(v.likes_count)}</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => api.engagement.share(id, 'other')}>
              <Ionicons name="share-social-outline" size={22} color={theme.colors.text} />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
          </View>

          {/* Channel row */}
          {channel ? (
            <Pressable style={styles.channelRow} onPress={() => router.push(`/channel/${channel.handle}`)}>
              <Image source={{ uri: channelAvatarUrl(channel) }} style={styles.channelAvatar} />
              <View style={styles.flex}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.meta}>{formatCount(channel.subscribers_count)} subscribers</Text>
              </View>
            </Pressable>
          ) : null}

          {/* Description */}
          {v.description ? (
            <Pressable onPress={() => setDescExpanded((e) => !e)} style={styles.desc}>
              <Text style={styles.descText} numberOfLines={descExpanded ? undefined : 3}>
                {v.description}
              </Text>
            </Pressable>
          ) : null}

          {/* Comments */}
          <Text style={styles.commentsHeading}>
            Comments{comments.data ? ` · ${formatCount(comments.data.totalComments)}` : ''}
          </Text>

          <View style={styles.addRow}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment…"
              placeholderTextColor={theme.colors.textMuted}
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
                  <Text style={styles.commentAuthor}>
                    {c.user?.username || 'user'} <Text style={styles.commentTime}>· {timeAgo(c.createdAt)}</Text>
                  </Text>
                  <Text style={styles.commentBody}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
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
  body: { padding: theme.spacing(4) },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1) },
  actions: { flexDirection: 'row', gap: theme.spacing(6), marginTop: theme.spacing(4) },
  action: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  actionText: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), marginTop: theme.spacing(5), paddingVertical: theme.spacing(3), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  channelAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceAlt },
  channelName: { color: theme.colors.text, fontWeight: '700', fontSize: 15 },
  desc: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing(3), marginTop: theme.spacing(4) },
  descText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  commentsHeading: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: theme.spacing(7), marginBottom: theme.spacing(3) },
  addRow: { flexDirection: 'row', gap: theme.spacing(2), alignItems: 'flex-end', marginBottom: theme.spacing(5) },
  commentInput: { flex: 1, color: theme.colors.text, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, paddingHorizontal: theme.spacing(3), paddingVertical: theme.spacing(2.5), maxHeight: 100 },
  postBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(3) },
  postBtnDim: { opacity: 0.5 },
  postBtnText: { color: '#000', fontWeight: '800' },
  comment: { flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(4) },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt },
  commentAuthor: { color: theme.colors.text, fontWeight: '700', fontSize: 13 },
  commentTime: { color: theme.colors.textMuted, fontWeight: '400' },
  commentBody: { color: theme.colors.text, fontSize: 14, marginTop: 2, lineHeight: 19 },
});
