import React, { useCallback, useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { EmptyState, ErrorState, LoadingState, VideoCard } from '../../../src/components/media';
import { channelAvatarUrl, channelImageUrl, formatCount } from '../../../src/lib/format';

const LIMIT = 12;

export default function ChannelScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const queryClient = useQueryClient();

  const channel = useQuery({ queryKey: ['channel', handle], queryFn: () => api.channels.getByHandle(handle), enabled: !!handle });
  const channelId = channel.data?.id;

  const videos = useInfiniteQuery({
    queryKey: ['channel-videos', channelId],
    queryFn: ({ pageParam }) => api.channels.getVideos(channelId as number, pageParam, LIMIT),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination?.hasMore ? (last.pagination.page ?? 1) + 1 : undefined),
    enabled: !!channelId,
  });

  const subscribe = useMutation({
    mutationFn: () => (channel.data?.isSubscribed ? api.channels.unsubscribe(handle) : api.channels.subscribe(handle)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel', handle] }),
  });

  const list = useMemo(() => videos.data?.pages.flatMap((p) => p.data ?? []) ?? [], [videos.data]);
  const onEndReached = useCallback(() => {
    if (videos.hasNextPage && !videos.isFetchingNextPage) videos.fetchNextPage();
  }, [videos]);

  if (channel.isLoading) {
    return (<><Stack.Screen options={{ title: 'Channel' }} /><LoadingState label="Loading channel…" /></>);
  }
  if (channel.isError || !channel.data) {
    return (<><Stack.Screen options={{ title: 'Channel' }} /><ErrorState onRetry={() => channel.refetch()} /></>);
  }

  const c = channel.data;

  const header = (
    <View>
      <Image source={{ uri: channelImageUrl(c) }} style={styles.banner} />
      <View style={styles.headerBody}>
        <Image source={{ uri: channelAvatarUrl(c) }} style={styles.avatar} />
        <Text style={styles.name}>{c.name}</Text>
        <Text style={styles.meta}>@{c.handle} · {formatCount(c.subscribers_count)} subscribers · {formatCount(c.videos_count)} videos</Text>
        {c.description ? <Text style={styles.desc} numberOfLines={3}>{c.description}</Text> : null}
        <Pressable
          onPress={() => subscribe.mutate()}
          disabled={subscribe.isPending}
          style={[styles.subBtn, c.isSubscribed ? styles.subBtnOn : styles.subBtnOff]}
        >
          <Text style={[styles.subText, c.isSubscribed ? styles.subTextOn : styles.subTextOff]}>
            {c.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Text>
        </Pressable>
        <Text style={styles.sectionTitle}>Videos</Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: c.name }} />
      <FlatList
        style={styles.flex}
        data={list}
        keyExtractor={(v) => `cv-${v.id}`}
        renderItem={({ item }) => <VideoCard video={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={videos.isLoading ? <LoadingState /> : <EmptyState message="No videos yet." />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(12) },
  banner: { width: '100%', height: 120, backgroundColor: theme.colors.surface, marginHorizontal: -theme.spacing(4), borderRadius: 0 },
  headerBody: { marginTop: -28 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: theme.colors.background, backgroundColor: theme.colors.surfaceAlt },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: theme.spacing(2) },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1) },
  desc: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: theme.spacing(3) },
  subBtn: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: theme.spacing(6), paddingVertical: theme.spacing(2.5), marginTop: theme.spacing(4) },
  subBtnOff: { backgroundColor: theme.colors.accent },
  subBtnOn: { backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  subText: { fontWeight: '800', fontSize: 14 },
  subTextOff: { color: '#000' },
  subTextOn: { color: theme.colors.text },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginTop: theme.spacing(7), marginBottom: theme.spacing(4) },
});
