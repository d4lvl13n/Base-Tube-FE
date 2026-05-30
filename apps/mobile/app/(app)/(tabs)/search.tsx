import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { EmptyState, ErrorState, LoadingState, VideoCard } from '../../../src/components/media';

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
  const query = useDebounced(text.trim(), 350);

  const search = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search.videos(query, 1, 24, 'relevance'),
    enabled: query.length > 1,
  });

  const results = useMemo(() => (Array.isArray(search.data?.data) ? search.data!.data : []), [search.data]);

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
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
  list: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(12) },
});
