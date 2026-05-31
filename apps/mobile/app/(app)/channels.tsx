import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ChannelSortOption } from '@basetube/api';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { ChannelRow, EmptyState, ErrorState, LoadingState } from '../../src/components/media';

const LIMIT = 24;

// Mirrors the web ChannelPage sort options (ranked by subscriber count by default).
const SORTS: { key: ChannelSortOption; label: string }[] = [
  { key: 'subscribers_count', label: 'Most subscribers' },
  { key: 'updatedAt', label: 'Recently active' },
  { key: 'createdAt', label: 'New channels' },
];

export default function ChannelsScreen() {
  const [sort, setSort] = useState<ChannelSortOption>('subscribers_count');

  const query = useInfiniteQuery({
    queryKey: ['channels', 'all', sort],
    queryFn: ({ pageParam }) => api.channels.list({ page: pageParam, limit: LIMIT, sort }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? (last.currentPage ?? 1) + 1 : undefined),
  });

  const channels = useMemo(() => query.data?.pages.flatMap((p) => p.channels ?? []) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  return (
    <>
      <Stack.Screen options={{ title: 'Channels' }} />
      <View style={styles.flex}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsRow}
        >
          {SORTS.map((s) => {
            const active = s.key === sort;
            return (
              <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {query.isLoading ? (
          <LoadingState label="Loading channels…" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(c) => `ch-${c.id}`}
            renderItem={({ item }) => <ChannelRow channel={item} />}
            ListHeaderComponent={total > 0 ? <Text style={styles.count}>{total.toLocaleString()} channels</Text> : null}
            contentContainerStyle={styles.content}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            ListEmptyComponent={<EmptyState message="No channels yet." />}
            ListFooterComponent={query.isFetchingNextPage ? <LoadingState /> : <View style={styles.footerPad} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  chipsRow: { flexGrow: 0 },
  chips: { flexDirection: 'row', gap: theme.spacing(2), paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(3) },
  chip: { paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(2), borderRadius: theme.radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#000' },
  count: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: theme.spacing(3) },
  content: { paddingHorizontal: theme.spacing(4), paddingTop: theme.spacing(1), paddingBottom: theme.spacing(10), flexGrow: 1 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  footerPad: { height: theme.spacing(6) },
});
