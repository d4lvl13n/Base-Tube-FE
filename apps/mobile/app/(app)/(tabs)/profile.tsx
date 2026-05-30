import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../src/lib/client';
import { theme } from '../../../src/theme';
import { Row, RowGroup } from '../../../src/components/Row';

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
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        {user?.primaryEmailAddress?.emailAddress ? (
          <Text style={styles.email}>{user.primaryEmailAddress.emailAddress}</Text>
        ) : null}
      </View>

      {/* Wallet */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>BaseTube wallet</Text>
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
      </View>

      <RowGroup>
        <Row icon="albums-outline" label="My library" onPress={() => router.push('/library')} />
        <Row icon="people-outline" label="Subscriptions" onPress={() => router.push('/subscriptions')} />
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </RowGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(12) },
  header: { alignItems: 'center', marginTop: theme.spacing(6) },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: theme.colors.accent, fontSize: 34, fontWeight: '800' },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: theme.spacing(4) },
  email: { color: theme.colors.textMuted, fontSize: 14, marginTop: theme.spacing(1) },
  walletCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, padding: theme.spacing(5), marginTop: theme.spacing(6) },
  walletLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  walletAddr: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: theme.spacing(2), fontVariant: ['tabular-nums'] },
  walletBalance: { color: theme.colors.accent, fontSize: 15, fontWeight: '700', marginTop: theme.spacing(1) },
  walletValue: { color: theme.colors.textMuted, fontSize: 15, marginTop: theme.spacing(2) },
});
