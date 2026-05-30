import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { Button, ErrorText } from '../../../src/components/ui';
import { ErrorState, LoadingState } from '../../../src/components/media';
import { formatCount, formatDuration, formatPrice, thumbnailUrl } from '../../../src/lib/format';

export default function PassDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const pass = useQuery({ queryKey: ['pass', slug], queryFn: () => api.passes.getById(slug), enabled: !!slug });
  const p = pass.data;

  const checkout = useMutation({
    mutationFn: async () => {
      const session = await api.passes.checkout(p!.id);
      return session;
    },
    onSuccess: async (session) => {
      setError(null);
      if (session.url) {
        await WebBrowser.openBrowserAsync(session.url);
        // No deep-link return yet (Brief G.1) — confirm via polling on return.
        router.push(`/checkout?purchaseId=${session.purchase_id ?? ''}&sessionId=${session.session_id ?? ''}&passId=${p!.id}`);
      }
    },
    onError: (e: any) => setError(e?.response?.data?.error?.message ?? e?.message ?? 'Could not start checkout.'),
  });

  if (pass.isLoading) return (<><Stack.Screen options={{ title: 'Pass' }} /><LoadingState label="Loading pass…" /></>);
  if (pass.isError || !p) return (<><Stack.Screen options={{ title: 'Pass' }} /><ErrorState onRetry={() => pass.refetch()} /></>);

  const cover = thumbnailUrl(p.videos?.[0] ? { thumbnail_url: p.videos[0].thumbnail_url } : null);
  const supplyLine = p.supply_cap ? `${formatCount(p.minted_count ?? 0)} / ${formatCount(p.supply_cap)} minted` : 'Open edition';
  const owned = p.has_access;
  const blocked = p.can_purchase === false && !owned;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Image source={{ uri: cover }} style={styles.hero} />
        <View style={styles.body}>
          <View style={styles.tierRow}>
            <View style={styles.tierBadge}><Text style={styles.tierText}>{(p.tier || 'pass').toUpperCase()}</Text></View>
            <Text style={styles.supply}>{supplyLine}</Text>
          </View>
          <Text style={styles.title}>{p.title}</Text>
          <Text style={styles.creator}>{p.channel?.name || p.channel?.user?.username || 'Creator'}</Text>
          {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}

          <Text style={styles.sectionTitle}>What's included</Text>
          {(p.videos ?? []).map((v) => (
            <View key={`pv-${v.id}`} style={styles.includeRow}>
              <Image source={{ uri: thumbnailUrl({ thumbnail_url: v.thumbnail_url }) }} style={styles.includeThumb} />
              <View style={styles.flex}>
                <Text style={styles.includeTitle} numberOfLines={2}>{v.title || 'Video'}</Text>
                {v.duration ? <Text style={styles.includeMeta}>{formatDuration(v.duration)}</Text> : null}
              </View>
              <Ionicons name={v.has_access ? 'play-circle' : 'lock-closed'} size={22} color={v.has_access ? theme.colors.accent : theme.colors.textMuted} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <ErrorText>{error}</ErrorText>
        {owned ? (
          <Button label="Watch now" onPress={() => router.push(`/watch/${p.id}`)} />
        ) : blocked ? (
          <Button label={p.purchase_block_reason || 'Unavailable'} onPress={() => {}} disabled />
        ) : (
          <>
            <Button
              label={`Buy · ${formatPrice(p.price_cents, p.currency, p.formatted_price)}`}
              onPress={() => checkout.mutate()}
              loading={checkout.isPending}
            />
            <Text style={styles.ctaNote}>Card payment opens securely in your browser. Crypto purchase coming soon.</Text>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: theme.spacing(28) },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.colors.surface },
  body: { padding: theme.spacing(4) },
  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tierText: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  supply: { color: theme.colors.textMuted, fontSize: 13 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '800', marginTop: theme.spacing(3) },
  creator: { color: theme.colors.textMuted, fontSize: 15, marginTop: theme.spacing(1) },
  desc: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: theme.spacing(4) },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: theme.spacing(7), marginBottom: theme.spacing(3) },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), paddingVertical: theme.spacing(2.5) },
  includeThumb: { width: 96, height: 54, borderRadius: 8, backgroundColor: theme.colors.surface },
  includeTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  includeMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, padding: theme.spacing(4), paddingBottom: theme.spacing(6) },
  ctaNote: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: theme.spacing(2) },
});
