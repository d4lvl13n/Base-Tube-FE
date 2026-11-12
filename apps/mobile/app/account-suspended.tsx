import React, { useEffect } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { Button, Heading, Subtle } from '../src/components/ui';
import { theme } from '../src/theme';
import { markAccountScreenDismissed, useAccountStatus } from '../src/lib/accountStatus';

const SUPPORT_EMAIL = 'hello@base.tube';

/**
 * Shown by `AccountGate` (app/_layout.tsx) when the backend refuses the
 * signed-in account with 403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED.
 *
 * Not a dead end: the backend still serves public content to such an account,
 * so "Keep watching" closes it. Leaving by any route (button, Android back)
 * counts as dismissed, so it cannot re-open itself in a loop; a refused
 * signed-in action brings it back. It closes itself if the account is restored.
 */
export default function AccountSuspendedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, isSignedIn } = useAuth();
  const { restriction } = useAccountStatus();
  const banned = restriction === 'banned';

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  };

  useEffect(() => () => markAccountScreenDismissed(), []);

  // Restored: nothing to show any more. (After "Sign out" the root layout
  // already sends the person to sign-in; do not navigate twice.)
  useEffect(() => {
    if (restriction === null && isSignedIn) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restriction, isSignedIn]);

  const contactSupport = async () => {
    const subject = encodeURIComponent(banned ? 'My account was banned' : 'My account is suspended');
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
    } catch {
      Alert.alert('Contact support', `Email us at ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing(10), paddingBottom: insets.bottom + theme.spacing(6) }]}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons name={banned ? 'ban-outline' : 'pause-circle-outline'} size={40} color={theme.colors.accent} />
        </View>
        <Heading>{banned ? 'Your account has been banned' : 'Your account is suspended'}</Heading>
        <Subtle>
          {banned
            ? 'You can still watch videos, but this account can no longer like, comment, subscribe, report or buy passes.'
            : 'You can still watch videos, but liking, commenting, subscribing, reporting and buying passes are paused until it is restored.'}
        </Subtle>
        <Text style={styles.contact}>
          Think this is a mistake? Email us at <Text style={styles.email}>{SUPPORT_EMAIL}</Text>.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Keep watching" onPress={leave} />
        <Button label="Contact support" variant="secondary" onPress={contactSupport} />
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing(6) },
  body: { flex: 1, justifyContent: 'center' },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
    marginBottom: theme.spacing(5),
  },
  contact: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 21, marginTop: theme.spacing(4) },
  email: { color: theme.colors.text, fontWeight: '700' },
  actions: { gap: theme.spacing(3) },
});
