import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { Video } from '@basetube/api';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { VideoCard } from '../../src/components/VideoCard';

interface SearchData {
  videos?: Video[];
}

export default function SearchScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');

  const search = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => api.search.videos(submitted),
    enabled: submitted.length > 0,
  });

  const results = (search.data?.data as SearchData | undefined)?.videos ?? [];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search videos"
        placeholderTextColor={theme.colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => setSubmitted(text.trim())}
        returnKeyType="search"
        autoCapitalize="none"
      />

      {search.isFetching ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : submitted && results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No results for "{submitted}".</Text>
        </View>
      ) : !submitted ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Search BaseTube for videos.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          style={styles.results}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <VideoCard
              video={{
                id: item.id,
                title: item.title,
                thumbnail_url: item.thumbnail_url,
                thumbnail_path: item.thumbnail_path,
                duration: item.duration,
                views_count: item.views_count,
                channelName: item.channel?.name,
              }}
              onPress={() => router.push(`/video/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing(4) },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    fontSize: 15,
  },
  results: { flex: 1, backgroundColor: theme.colors.background },
  list: { paddingTop: theme.spacing(4) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.textMuted, fontSize: 15 },
});
