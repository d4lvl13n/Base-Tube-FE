import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { SearchSort } from '@basetube/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { EmptyState, ErrorState, LoadingState, VideoCard } from '../../../src/components/media';
import { AppHeader, HEADER_HEIGHT } from '../../../src/components/chrome';

const SORTS: { key: SearchSort; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'date', label: 'Newest' },
  { key: 'views', label: 'Most viewed' },
];

/** Debounce a changing value by `ms`. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SearchScreen() {
  const [text, setText] = useState('');
  const [sort, setSort] = useState<SearchSort>('relevance');
  const query = useDebounced(text.trim(), 350);
  const insets = useSafeAreaInsets();

  const search = useQuery({
    queryKey: ['search', query, sort],
    queryFn: () => api.search.videos(query, 1, 24, sort),
    enabled: query.length > 1,
  });

  const results = useMemo(() => (Array.isArray(search.data?.data) ? search.data!.data : []), [search.data]);

  return (
    <View style={styles.flex}>
      <AppHeader />
      <View style={[styles.searchBar, { marginTop: insets.top + HEADER_HEIGHT + theme.spacing(2) }]}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search videos"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {query.length > 1 ? (
        <View style={styles.sortRow}>
          {SORTS.map((s) => {
            const active = s.key === sort;
            return (
              <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.sortChip, active && styles.sortChipActive]}>
                <Text style={[styles.sortText, active && styles.sortTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {query.length <= 1 ? (
        <EmptyState message="Search BaseTube for videos and creators." />
      ) : search.isLoading ? (
        <LoadingState label={`Searching "${query}"…`} />
      ) : search.isError ? (
        <ErrorState onRetry={() => search.refetch()} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(v) => `search-${v.id}`}
          renderItem={({ item }) => <VideoCard video={item as any} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState message={`No results for "${query}".`} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    margin: theme.spacing(4),
    paddingHorizontal: theme.spacing(4),
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  input: { flex: 1, color: theme.colors.text, fontSize: 16, paddingVertical: theme.spacing(3.5) },
  sortRow: { flexDirection: 'row', gap: theme.spacing(2), paddingHorizontal: theme.spacing(4), marginBottom: theme.spacing(3) },
  sortChip: { paddingHorizontal: theme.spacing(3.5), paddingVertical: theme.spacing(2), borderRadius: theme.radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  sortChipActive: { backgroundColor: theme.colors.accentSoft, borderColor: 'rgba(250,117,23,0.5)' },
  sortText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 12.5 },
  sortTextActive: { color: theme.colors.accentBright },
  list: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(28) },
});
