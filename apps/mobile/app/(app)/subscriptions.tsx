import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { ChannelRow, EmptyState, ErrorState, LoadingState } from '../../src/components/media';

export default function SubscriptionsScreen() {
  const subs = useQuery({ queryKey: ['subscribed'], queryFn: () => api.channels.subscribed(1, 50) });
  const channels = subs.data?.channels ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'Subscriptions' }} />
      <View style={styles.flex}>
        {subs.isLoading ? (
          <LoadingState label="Loading subscriptions…" />
        ) : subs.isError ? (
          <ErrorState onRetry={() => subs.refetch()} />
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(c) => `sub-${c.id}`}
            renderItem={({ item }) => <ChannelRow channel={item} />}
            contentContainerStyle={styles.content}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={<EmptyState message="You're not subscribed to any channels yet." />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), flexGrow: 1 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
