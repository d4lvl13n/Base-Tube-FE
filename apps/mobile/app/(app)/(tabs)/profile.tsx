import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { Row, RowGroup } from '../../../src/components/Row';
import { AccentHairline, AmbientGlow } from '../../../src/components/primitives';
import { Ionicons } from '@expo/vector-icons';

function shortAddress(addr?: string | null): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ProfileScreen() {
  const { user } = useUser();
  const router = useRouter();

  const wallet = useQuery({ queryKey: ['my-wallet'], queryFn: () => api.profile.myWallet(), retry: false });

  const displayName = user?.username || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'BaseTube user';
  const avatar = user?.imageUrl;

  return (
    <View style={styles.root}>
      <AmbientGlow height={260} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {user?.primaryEmailAddress?.emailAddress ? (
          <Text style={styles.email}>{user.primaryEmailAddress.emailAddress}</Text>
        ) : null}
      </View>

      {/* Wallet */}
      <LinearGradient
        colors={['rgba(250,117,23,0.14)', 'rgba(12,12,14,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <AccentHairline style={styles.walletHairline} />
        <View style={styles.walletTop}>
          <Text style={styles.walletLabel}>BaseTube wallet</Text>
          <Ionicons name="wallet-outline" size={18} color={theme.colors.accentBright} />
        </View>
        {wallet.isLoading ? (
          <Text style={styles.walletValue}>Loading…</Text>
        ) : wallet.data?.walletAddress ? (
          <>
            <Text style={styles.walletAddr}>{shortAddress(wallet.data.walletAddress)}</Text>
            <Text style={styles.walletBalance}>
              {typeof wallet.data.balance === 'number' ? `${wallet.data.balance} TUBE` : 'Balance unavailable'}
            </Text>
          </>
        ) : (
          <Text style={styles.walletValue}>No wallet linked yet.</Text>
        )}
      </LinearGradient>

      <RowGroup>
        <Row icon="albums-outline" label="My library" onPress={() => router.push('/library')} />
        <Row icon="people-outline" label="Subscriptions" onPress={() => router.push('/subscriptions')} />
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </RowGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(28) },
  header: { alignItems: 'center', marginTop: theme.spacing(8) },
  avatarRing: { width: 96, height: 96, borderRadius: 48, padding: 3, borderWidth: 1.5, borderColor: theme.colors.borderStrong },
  avatar: { width: '100%', height: '100%', borderRadius: 48, backgroundColor: theme.colors.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: theme.colors.accent, fontSize: 36, fontWeight: '800' },
  name: { color: theme.colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.3, marginTop: theme.spacing(4) },
  email: { color: theme.colors.textMuted, fontSize: 14, marginTop: theme.spacing(1) },
  walletCard: { borderRadius: theme.radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderStrong, padding: theme.spacing(5), marginTop: theme.spacing(7), overflow: 'hidden', ...theme.shadow.soft },
  walletHairline: { position: 'absolute', top: 0, left: 0, right: 0 },
  walletTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletLabel: { color: theme.colors.textMuted, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  walletAddr: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: theme.spacing(3), fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  walletBalance: { color: theme.colors.accentBright, fontSize: 15, fontWeight: '800', marginTop: theme.spacing(1.5) },
  walletValue: { color: theme.colors.textMuted, fontSize: 15, marginTop: theme.spacing(3) },
});
