import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { VideoCard } from '../../src/components/VideoCard';
import { formatCount, resolveMediaUrl } from '../../src/lib/format';

export default function HomeScreen() {
  const router = useRouter();

  const featured = useQuery({
    queryKey: ['featured'],
    queryFn: () => api.videos.getFeatured(5),
  });

  const trending = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.videos.getTrending({ limit: 20 }),
  });

  const trendingVideos = trending.data?.data.videos ?? [];

  if (trending.isLoading && featured.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (trending.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load videos.</Text>
        <Pressable style={styles.retry} onPress={() => trending.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={trendingVideos}
      keyExtractor={(item) => String(item.id)}
      style={styles.screen}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Text style={styles.brand}>
            Base<Text style={{ color: theme.colors.accent }}>Tube</Text>
          </Text>
          {featured.data && featured.data.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Featured</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featured.data}
                keyExtractor={(item) => `f-${item.id}`}
                contentContainerStyle={styles.featuredRow}
                renderItem={({ item }) => {
                  const thumb = resolveMediaUrl(item.thumbnail_url);
                  return (
                    <Pressable style={styles.featuredCard} onPress={() => router.push(`/video/${item.id}`)}>
                      {thumb ? <Image source={{ uri: thumb }} style={styles.featuredThumb} /> : null}
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.featuredMeta} numberOfLines={1}>
                        {item.channel?.name ?? 'BaseTube'} · {formatCount(item.views_count)} views
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </>
          ) : null}
          <Text style={styles.sectionTitle}>Trending</Text>
        </View>
      }
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
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing(4) },
  brand: { color: theme.colors.text, fontSize: 26, fontWeight: '800', marginBottom: theme.spacing(2) },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
  featuredRow: { paddingRight: theme.spacing(4) },
  featuredCard: { width: 260, marginRight: theme.spacing(3) },
  featuredThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  featuredTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginTop: theme.spacing(2) },
  featuredMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing(1) },
  errorText: { color: theme.colors.textMuted, fontSize: 15, marginBottom: theme.spacing(3) },
  retry: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing(5),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.sm,
  },
  retryText: { color: '#000', fontWeight: '700' },
});
