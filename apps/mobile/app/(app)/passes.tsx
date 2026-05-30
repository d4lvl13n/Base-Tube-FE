import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/media';
import { PassCard } from '../../src/components/pass';

const LIMIT = 12;

export default function PassesBrowseScreen() {
  const query = useInfiniteQuery({
    queryKey: ['passes', 'discover'],
    queryFn: ({ pageParam }) => api.passes.discover({ limit: LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + (p.data?.length ?? 0), 0);
      return last.pagination && loaded < last.pagination.total ? loaded : undefined;
    },
  });

  const passes = useMemo(() => query.data?.pages.flatMap((p) => p.data ?? []) ?? [], [query.data]);
  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  return (
    <>
      <Stack.Screen options={{ title: 'Passes' }} />
      {query.isLoading ? (
        <LoadingState label="Loading passes…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          style={styles.flex}
          data={passes}
          keyExtractor={(p) => `disc-pass-${p.id}`}
          renderItem={({ item }) => <PassCard pass={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListEmptyComponent={<EmptyState message="No passes available yet." />}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(12) },
});
