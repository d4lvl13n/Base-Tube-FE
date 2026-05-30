import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Heading, Screen, Subtle } from '../../src/components/ui';
import { theme } from '../../src/theme';

/**
 * Wallet sign-in (README screen 2) — intentionally gated.
 *
 * Web3 wallet auth is cookie-only on the backend today; there is no
 * `Authorization: Bearer` path for the Web3 JWT (Mobile Readiness Brief, G.1).
 * Native clients have no shared cookie jar, so wallet login cannot authenticate
 * cleanly yet. This screen ships as a clear "coming soon" until the additive
 * backend bearer change lands; the SDK transport + `web3auth.*` endpoints are
 * already in place to wire it up at that point.
 */
export default function WalletAuthScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
        <Heading>Sign in with a wallet</Heading>
        <Subtle>
          Wallet sign-in is on the way. It needs a small backend update so the
          app can authenticate with a token instead of a browser cookie. For now,
          continue with email or Google.
        </Subtle>
      </View>
      <Button label="Back to sign in" variant="secondary" onPress={() => router.replace('/(auth)/sign-in')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    marginBottom: theme.spacing(4),
  },
  badgeText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
