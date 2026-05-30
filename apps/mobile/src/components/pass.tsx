import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Pass } from '@basetube/api';
import { theme } from '../theme';
import { AccentHairline, Pill, Scrim } from './primitives';
import { SectionHeader } from './media';
import { formatPrice, thumbnailUrl } from '../lib/format';

function passHref(pass: Pass): string {
  return `/p/${pass.slug || pass.id}`;
}
function passCover(pass: Pass): string {
  const v = pass.videos?.[0];
  return thumbnailUrl(v ? { thumbnail_url: v.thumbnail_url } : null);
}
function creatorName(pass: Pass): string {
  return pass.channel?.name || pass.channel?.user?.username || 'Creator';
}

/** Premium pass card for listings. */
export function PassCard({ pass }: { pass: Pass }) {
  const router = useRouter();
  const owned = pass.has_access;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => router.push(passHref(pass))}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: passCover(pass) }} style={StyleSheet.absoluteFill} />
        <Scrim />
        <AccentHairline variant="gold" style={styles.hairline} />
        <View style={styles.coverTop}>
          <Pill label={pass.tier || 'Pass'} tone="gold" />
          {owned ? <Pill label="Owned" tone="accent" /> : null}
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.title} numberOfLines={1}>{pass.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{creatorName(pass)}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{owned ? 'In your library' : formatPrice(pass.price_cents, pass.currency, pass.formatted_price)}</Text>
        {!owned ? <Text style={styles.cta}>Get pass →</Text> : null}
      </View>
    </Pressable>
  );
}

/** Horizontal rail of pass tiles ("Drops this week"). */
export function PassRail({ title, passes, action, onAction }: { title: string; passes: Pass[]; action?: string; onAction?: () => void }) {
  const router = useRouter();
  if (!passes.length) return null;
  return (
    <View style={styles.railBlock}>
      <SectionHeader title={title} action={action} onAction={onAction} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {passes.map((p) => {
          const owned = p.has_access;
          return (
            <Pressable key={`pr-${p.id}`} style={({ pressed }) => [styles.railItem, pressed && styles.pressed]} onPress={() => router.push(passHref(p))}>
              <View style={styles.railCover}>
                <Image source={{ uri: passCover(p) }} style={StyleSheet.absoluteFill} />
                <Scrim />
                <AccentHairline variant="gold" style={styles.hairline} />
                <View style={styles.railCoverTop}><Pill label={p.tier || 'Pass'} tone="gold" /></View>
                <Text style={styles.railTitle} numberOfLines={1}>{p.title}</Text>
              </View>
              <Text style={styles.price}>{owned ? 'Owned' : formatPrice(p.price_cents, p.currency, p.formatted_price)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.992 }] },
  card: { marginBottom: theme.spacing(5) },
  coverWrap: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    aspectRatio: 16 / 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    ...theme.shadow.soft,
  },
  hairline: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  coverTop: { position: 'absolute', top: theme.spacing(3), left: theme.spacing(3), right: theme.spacing(3), flexDirection: 'row', justifyContent: 'space-between' },
  coverBottom: { position: 'absolute', left: theme.spacing(4), right: theme.spacing(4), bottom: theme.spacing(3.5) },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  meta: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing(3) },
  price: { color: theme.colors.accentBright, fontSize: 14.5, fontWeight: '800', marginTop: theme.spacing(2) },
  cta: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: theme.spacing(2) },

  railBlock: { marginTop: theme.spacing(7) },
  railContent: { gap: theme.spacing(3.5), paddingRight: theme.spacing(4) },
  railItem: { width: 220 },
  railCover: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    aspectRatio: 16 / 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  railCoverTop: { position: 'absolute', top: theme.spacing(3), left: theme.spacing(3) },
  railTitle: { position: 'absolute', left: theme.spacing(3.5), right: theme.spacing(3.5), bottom: theme.spacing(3), color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
