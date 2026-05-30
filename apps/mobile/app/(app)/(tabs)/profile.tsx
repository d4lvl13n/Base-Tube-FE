import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Button, Screen } from '../../../src/components/ui';
import { theme } from '../../../src/theme';

/**
 * Profile (README screen 10). Auth-phase version: shows the Clerk identity and
 * sign-out. The wallet + owned-content sections (profile.me / profile.myWallet)
 * are built in the core-consumer phase.
 */
export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const displayName = user?.username || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'BaseTube user';
  const avatar = user?.imageUrl;

  return (
    <Screen>
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

      <View style={styles.spacer} />
      <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: theme.spacing(8) },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: theme.colors.accent, fontSize: 34, fontWeight: '800' },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: theme.spacing(4) },
  email: { color: theme.colors.textMuted, fontSize: 14, marginTop: theme.spacing(1) },
  spacer: { flex: 1 },
});
