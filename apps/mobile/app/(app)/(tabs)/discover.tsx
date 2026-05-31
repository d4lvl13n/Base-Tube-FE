import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { VideoSort } from '@basetube/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { EmptyState, ErrorState, LoadingState, VideoCard } from '../../../src/components/media';
import { AppHeader, HEADER_HEIGHT } from '../../../src/components/chrome';

const SORTS: { key: VideoSort; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
  { key: 'popular', label: 'Popular' },
];

const LIMIT = 12;

export default function DiscoverScreen() {
  const [sort, setSort] = useState<VideoSort>('trending');
  const insets = useSafeAreaInsets();

  const query = useInfiniteQuery({
    queryKey: ['discovery', sort],
    queryFn: ({ pageParam }) => api.discovery.getFeed({ page: pageParam, limit: LIMIT, sort, timeFrame: 'all' }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination?.hasMore ? (last.pagination.page ?? 1) + 1 : undefined),
  });

  const videos = useMemo(() => query.data?.pages.flatMap((p) => p.data ?? []) ?? [], [query.data]);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  return (
    <View style={styles.flex}>
      <View style={[styles.chips, { paddingTop: insets.top + HEADER_HEIGHT + theme.spacing(2) }]}>
        {SORTS.map((s) => {
          const active = s.key === sort;
          return (
            <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <LoadingState label="Loading discover…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => `disc-${v.id}`}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListEmptyComponent={<EmptyState message="Nothing to discover yet." />}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={theme.colors.accent} />}
        />
      )}
      <AppHeader />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  chips: { flexDirection: 'row', gap: theme.spacing(2), paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(3) },
  chip: { paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(2), borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#000' },
  list: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(28) },
});
