import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import {
  CreatorRail,
  EmptyState,
  ErrorState,
  FeaturedCard,
  LoadingState,
  VideoCard,
  VideoRail,
} from '../../../src/components/media';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const featured = useQuery({ queryKey: ['featured'], queryFn: () => api.videos.getFeatured(3) });
  const trending = useQuery({ queryKey: ['trending', 'home'], queryFn: () => api.videos.getTrending({ limit: 10, timeFrame: 'week' }) });
  const channels = useQuery({ queryKey: ['channels', 'popular'], queryFn: () => api.channels.popular(1, 12) });

  const refreshing = featured.isRefetching || trending.isRefetching || channels.isRefetching;
  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['featured'] });
    queryClient.invalidateQueries({ queryKey: ['trending', 'home'] });
    queryClient.invalidateQueries({ queryKey: ['channels', 'popular'] });
  }, [queryClient]);

  const loading = featured.isLoading && trending.isLoading && channels.isLoading;
  const errored = featured.isError && trending.isError && channels.isError;

  const trendingVideos = trending.data?.data?.videos ?? [];
  const popularChannels = channels.data?.data ?? [];
  const featuredVideos = featured.data ?? [];
  const hero = featuredVideos[0];
  const restFeatured = featuredVideos.slice(1);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
    >
      <Text style={styles.brand}>
        Base<Text style={{ color: theme.colors.accent }}>Tube</Text>
      </Text>

      {loading ? (
        <LoadingState label="Loading your feed…" />
      ) : errored ? (
        <ErrorState onRetry={onRefresh} />
      ) : (
        <>
          {hero ? <FeaturedCard video={hero} /> : null}

          <VideoRail
            title="Trending on BaseTube"
            videos={trendingVideos}
            action="See all"
            onAction={() => router.push('/discover')}
          />

          <CreatorRail
            title="Popular creators"
            channels={popularChannels}
            action="See all"
            onAction={() => router.push('/discover')}
          />

          {restFeatured.length > 0 || trendingVideos.length > 0 ? (
            <View style={styles.feed}>
              <Text style={styles.feedHeading}>More to watch</Text>
              {[...restFeatured, ...trendingVideos].map((v) => (
                <VideoCard key={`feed-${v.id}`} video={v} />
              ))}
            </View>
          ) : (
            <EmptyState message="No videos yet. Check back soon." />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(12) },
  brand: { color: theme.colors.text, fontSize: 24, fontWeight: '800', marginVertical: theme.spacing(3) },
  feed: { marginTop: theme.spacing(8) },
  feedHeading: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: theme.spacing(4) },
});
