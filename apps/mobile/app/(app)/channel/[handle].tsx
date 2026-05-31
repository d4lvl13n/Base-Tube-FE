import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { EmptyState, ErrorState, LoadingState, VideoCard } from '../../../src/components/media';
import { AccentHairline, GlassCircleButton, Scrim } from '../../../src/components/primitives';
import { channelAvatarUrl, channelImageUrl, formatCount } from '../../../src/lib/format';
import { haptics } from '../../../src/lib/haptics';

const LIMIT = 12;
const NO_HEADER = { headerShown: false } as const;

export default function ChannelScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    onMutate: async () => {
      haptics.medium();
      await queryClient.cancelQueries({ queryKey: ['channel', handle] });
      const prev = queryClient.getQueryData<any>(['channel', handle]);
      queryClient.setQueryData(['channel', handle], (old: any) =>
        old
          ? { ...old, isSubscribed: !old.isSubscribed, subscribers_count: (old.subscribers_count || 0) + (old.isSubscribed ? -1 : 1) }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['channel', handle], ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['channel', handle] }),
  });

  const list = useMemo(() => videos.data?.pages.flatMap((p) => p.data ?? []) ?? [], [videos.data]);
  const onEndReached = useCallback(() => {
    if (videos.hasNextPage && !videos.isFetchingNextPage) videos.fetchNextPage();
  }, [videos]);

  const backBtn = (
    <GlassCircleButton
      icon="chevron-back"
      onPress={() => router.back()}
      style={[styles.backBtn, { top: insets.top + 6 }]}
    />
  );

  if (channel.isLoading) {
    return (
      <View style={styles.flex}>
        <Stack.Screen options={NO_HEADER} />
        <LoadingState label="Loading channel…" />
        {backBtn}
      </View>
    );
  }
  if (channel.isError || !channel.data) {
    return (
      <View style={styles.flex}>
        <Stack.Screen options={NO_HEADER} />
        <ErrorState onRetry={() => channel.refetch()} />
        {backBtn}
      </View>
    );
  }

  const c = channel.data;

  const header = (
    <View>
      <View style={styles.bannerWrap}>
        <Image transition={150} source={{ uri: channelImageUrl(c) }} style={StyleSheet.absoluteFill} />
        <Scrim />
        <AccentHairline style={styles.bannerHairline} />
      </View>
      <View style={styles.headerBody}>
        <View style={styles.avatarRing}>
          <Image transition={150} source={{ uri: channelAvatarUrl(c) }} style={styles.avatar} />
        </View>
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
    <View style={styles.flex}>
      <Stack.Screen options={NO_HEADER} />
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
      {backBtn}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  backBtn: { position: 'absolute', left: theme.spacing(4), zIndex: 20 },
  content: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(12) },
  bannerWrap: { height: 150, backgroundColor: theme.colors.surface, marginLeft: -theme.spacing(4), marginRight: -theme.spacing(4), overflow: 'hidden' },
  bannerHairline: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerBody: { marginTop: -36 },
  avatarRing: { width: 84, height: 84, borderRadius: 42, padding: 3, backgroundColor: theme.colors.background, alignSelf: 'flex-start' },
  avatar: { width: '100%', height: '100%', borderRadius: 42, borderWidth: 1.5, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surfaceAlt },
  name: { color: theme.colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.4, marginTop: theme.spacing(2) },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1), fontWeight: '500' },
  desc: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: theme.spacing(3) },
  subBtn: { alignSelf: 'flex-start', borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing(7), paddingVertical: theme.spacing(3), marginTop: theme.spacing(4) },
  subBtnOff: { backgroundColor: theme.colors.accent },
  subBtnOn: { backgroundColor: theme.colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderStrong },
  subText: { fontWeight: '800', fontSize: 14 },
  subTextOff: { color: '#1a0c00' },
  subTextOn: { color: theme.colors.text },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: theme.spacing(7), marginBottom: theme.spacing(4) },
});
