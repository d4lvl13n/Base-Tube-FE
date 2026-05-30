import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/media';
import { PassCard } from '../../src/components/pass';

export default function LibraryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const owned = useQuery({ queryKey: ['passes', 'owned'], queryFn: () => api.passes.owned() });
  const pending = useQuery({ queryKey: ['purchases', 'pending'], queryFn: () => api.purchases.pending(), retry: false });

  const refreshing = owned.isRefetching || pending.isRefetching;
  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['passes', 'owned'] });
    queryClient.invalidateQueries({ queryKey: ['purchases', 'pending'] });
  };

  const passes = owned.data ?? [];
  const pendingList = pending.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'My library' }} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        {pendingList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awaiting wallet</Text>
            <Text style={styles.sectionNote}>Paid passes that mint to your wallet once you connect one.</Text>
            {pendingList.map((pp) => (
              <View key={`pp-${pp.purchaseId}`} style={styles.pendingRow}>
                <View style={styles.flex}>
                  <Text style={styles.pendingTitle} numberOfLines={1}>{pp.passTitle || 'Content pass'}</Text>
                  <Text style={styles.pendingStatus}>{pp.status}</Text>
                </View>
                <Text style={styles.pendingTag}>Pending</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Your passes</Text>
        {owned.isLoading ? (
          <LoadingState label="Loading your passes…" />
        ) : owned.isError ? (
          <ErrorState onRetry={() => owned.refetch()} />
        ) : passes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState message="You don't own any passes yet." />
            <Button label="Browse passes" onPress={() => router.push('/passes')} />
          </View>
        ) : (
          <>
            {passes.map((p) => (
              <PassCard key={`owned-${p.id}`} pass={p} />
            ))}
            <Button label="Browse more passes" variant="secondary" onPress={() => router.push('/passes')} />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(12) },
  section: { marginBottom: theme.spacing(6) },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: theme.spacing(3) },
  sectionNote: { color: theme.colors.textMuted, fontSize: 13, marginTop: -theme.spacing(2), marginBottom: theme.spacing(3) },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing(4), marginBottom: theme.spacing(2) },
  pendingTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  pendingStatus: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  pendingTag: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  emptyWrap: { gap: theme.spacing(2) },
});
