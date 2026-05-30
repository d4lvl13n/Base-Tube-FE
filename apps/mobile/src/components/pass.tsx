import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Pass } from '@basetube/api';
import { theme } from '../theme';
import { formatPrice, thumbnailUrl } from '../lib/format';

function passHref(pass: Pass): string {
  return `/p/${pass.slug || pass.id}`;
}

function passCover(pass: Pass): string {
  const firstVideo = pass.videos?.[0];
  return thumbnailUrl(firstVideo ? { thumbnail_url: firstVideo.thumbnail_url } : null);
}

/** Pass card for listings (Library, browse). */
export function PassCard({ pass }: { pass: Pass }) {
  const router = useRouter();
  const owned = pass.has_access;
  return (
    <Pressable style={styles.card} onPress={() => router.push(passHref(pass))}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: passCover(pass) }} style={styles.cover} />
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{(pass.tier || 'pass').toUpperCase()}</Text>
        </View>
        {owned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>OWNED</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>{pass.title}</Text>
      <Text style={styles.meta} numberOfLines={1}>{pass.channel?.name || pass.channel?.user?.username || 'Creator'}</Text>
      <Text style={styles.price}>{owned ? 'In your library' : formatPrice(pass.price_cents, pass.currency, pass.formatted_price)}</Text>
    </Pressable>
  );
}

/** Horizontal rail of pass tiles ("Drops this week" on Home). */
export function PassRail({ title, passes, action, onAction }: { title: string; passes: Pass[]; action?: string; onAction?: () => void }) {
  const router = useRouter();
  if (!passes.length) return null;
  return (
    <View style={styles.railBlock}>
      <View style={styles.railHeader}>
        <Text style={styles.railHeaderTitle}>{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8}><Text style={styles.railHeaderAction}>{action}</Text></Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {passes.map((p) => (
          <Pressable key={`pr-${p.id}`} style={styles.railItem} onPress={() => router.push(`/p/${p.slug || p.id}`)}>
            <View style={styles.railCoverWrap}>
              <Image source={{ uri: passCover(p) }} style={styles.cover} />
              <View style={styles.tierBadge}><Text style={styles.tierText}>{(p.tier || 'pass').toUpperCase()}</Text></View>
            </View>
            <Text style={styles.title} numberOfLines={1}>{p.title}</Text>
            <Text style={styles.price}>{p.has_access ? 'Owned' : formatPrice(p.price_cents, p.currency, p.formatted_price)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing(5) },
  railBlock: { marginTop: theme.spacing(6) },
  railHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(3) },
  railHeaderTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  railHeaderAction: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  railContent: { gap: theme.spacing(3), paddingRight: theme.spacing(4) },
  railItem: { width: 200 },
  railCoverWrap: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 9 },
  coverWrap: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface, aspectRatio: 16 / 9 },
  cover: { width: '100%', height: '100%' },
  tierBadge: { position: 'absolute', top: theme.spacing(2), left: theme.spacing(2), backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tierText: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ownedBadge: { position: 'absolute', top: theme.spacing(2), right: theme.spacing(2), backgroundColor: theme.colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ownedText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginTop: theme.spacing(2) },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  price: { color: theme.colors.accent, fontSize: 14, fontWeight: '800', marginTop: theme.spacing(1) },
});
