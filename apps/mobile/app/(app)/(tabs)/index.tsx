import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { AmbientGlow, Skeleton } from '../../../src/components/primitives';
import { AppHeader, HEADER_HEIGHT, ScrollChromeProvider, useScrollChrome } from '../../../src/components/chrome';
import {
  CreatorRail,
  EmptyState,
  ErrorState,
  FeaturedCard,
  VideoCard,
  VideoRail,
} from '../../../src/components/media';
import { PassRail } from '../../../src/components/pass';

function HomeSkeleton() {
  return (
    <View>
      <Skeleton style={styles.skHero} />
      <View style={styles.skRow}>
        <Skeleton style={styles.skRailTitle} />
      </View>
      <View style={styles.skRailRow}>
        <Skeleton style={styles.skRail} />
        <Skeleton style={styles.skRail} />
      </View>
      <View style={styles.skRow}>
        <Skeleton style={styles.skRailTitle} />
      </View>
      <View style={styles.skCardRow}>
        <Skeleton style={styles.skAvatar} />
        <View style={styles.skCardText}>
          <Skeleton style={styles.skLine} />
          <Skeleton style={[styles.skLine, { width: '55%' }]} />
        </View>
      </View>
    </View>
  );
}

function HomeFeed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { onScroll } = useScrollChrome();

  const featured = useQuery({ queryKey: ['featured'], queryFn: () => api.videos.getFeatured(3) });
  const trending = useQuery({ queryKey: ['trending', 'home'], queryFn: () => api.videos.getTrending({ limit: 10, timeFrame: 'week' }) });
  const channels = useQuery({ queryKey: ['channels', 'popular'], queryFn: () => api.channels.popular(1, 12) });
  const passes = useQuery({ queryKey: ['passes', 'drops'], queryFn: () => api.passes.discover({ limit: 8 }), retry: false });

  const refreshing = featured.isRefetching || trending.isRefetching || channels.isRefetching;
  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['featured'] });
    queryClient.invalidateQueries({ queryKey: ['trending', 'home'] });
    queryClient.invalidateQueries({ queryKey: ['channels', 'popular'] });
    queryClient.invalidateQueries({ queryKey: ['passes', 'drops'] });
  }, [queryClient]);

  const loading = featured.isLoading && trending.isLoading && channels.isLoading;
  const errored = featured.isError && trending.isError && channels.isError;

  const trendingVideos = trending.data?.data?.videos ?? [];
  const popularChannels = channels.data?.data ?? [];
  const featuredVideos = featured.data ?? [];
  const hero = featuredVideos[0];
  const restFeatured = featuredVideos.slice(1);
  // De-dupe: a featured video can also be trending → avoid duplicate React keys.
  const seenFeed = new Set<string | number>();
  const moreToWatch = [...restFeatured, ...trendingVideos].filter((v) => {
    if (seenFeed.has(v.id)) return false;
    seenFeed.add(v.id);
    return true;
  });

  return (
    <View style={styles.root}>
      <AmbientGlow height={320} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + HEADER_HEIGHT + theme.spacing(2) }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
            progressViewOffset={insets.top + HEADER_HEIGHT}
          />
        }
      >
        <Text style={styles.greeting}>For you</Text>

        {loading ? (
          <HomeSkeleton />
        ) : errored ? (
          <ErrorState onRetry={onRefresh} />
        ) : (
          <>
            {hero ? <FeaturedCard video={hero} /> : null}

            <VideoRail title="Trending now" videos={trendingVideos} action="See all" onAction={() => router.push('/discover')} />

            <PassRail title="Drops this week" passes={passes.data?.data ?? []} action="View all" onAction={() => router.push('/passes')} />

            <CreatorRail title="Creators to watch" channels={popularChannels} action="See all" onAction={() => router.push('/channels')} />

            {moreToWatch.length > 0 ? (
              <View style={styles.feed}>
                <Text style={styles.feedHeading}>More to watch</Text>
                {moreToWatch.map((v) => (
                  <VideoCard key={`feed-${v.id}`} video={v} />
                ))}
              </View>
            ) : (
              <EmptyState message="No videos yet. Check back soon." />
            )}
          </>
        )}
      </ScrollView>
      <AppHeader />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScrollChromeProvider>
      <HomeFeed />
    </ScrollChromeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(28) },
  greeting: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600', marginBottom: theme.spacing(4) },
  feed: { marginTop: theme.spacing(8) },
  feedHeading: { color: theme.colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3, marginBottom: theme.spacing(4) },

  // skeletons
  skHero: { width: '100%', aspectRatio: 16 / 10, borderRadius: theme.radius.xl },
  skRow: { marginTop: theme.spacing(7) },
  skRailTitle: { width: 140, height: 20, borderRadius: 6 },
  skRailRow: { flexDirection: 'row', gap: theme.spacing(3.5), marginTop: theme.spacing(3.5) },
  skRail: { width: 232, height: 130, borderRadius: theme.radius.lg },
  skCardRow: { flexDirection: 'row', gap: theme.spacing(3), marginTop: theme.spacing(4) },
  skAvatar: { width: 38, height: 38, borderRadius: 19 },
  skCardText: { flex: 1, gap: theme.spacing(2), justifyContent: 'center' },
  skLine: { height: 14, borderRadius: 5, width: '90%' },
});
