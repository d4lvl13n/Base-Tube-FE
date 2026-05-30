import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { Button } from '../../src/components/ui';

const ACCESS_GRANTED = ['pending', 'minting', 'minted', 'claiming', 'claimed', 'completed'];
const FAILED = ['failed', 'expired'];

export default function CheckoutReturnScreen() {
  const { purchaseId, sessionId, passId } = useLocalSearchParams<{ purchaseId?: string; sessionId?: string; passId?: string }>();
  const router = useRouter();

  const poll = useQuery({
    queryKey: ['checkout-status', purchaseId, sessionId],
    queryFn: async () => {
      if (purchaseId) return (await api.purchases.status(purchaseId)).status;
      if (sessionId) return (await api.passes.checkoutStatus(sessionId)).status;
      return 'unknown';
    },
    enabled: Boolean(purchaseId || sessionId),
    refetchInterval: (q) => {
      const s = (q.state.data as string) ?? '';
      return ACCESS_GRANTED.includes(s) || FAILED.includes(s) ? false : 3000;
    },
  });

  const status = (poll.data as string) ?? '';
  const granted = ACCESS_GRANTED.includes(status);
  const failed = FAILED.includes(status);
  const settling = !granted && !failed;

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <View style={styles.container}>
        {settling ? (
          <>
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text style={styles.title}>Confirming your purchase…</Text>
            <Text style={styles.sub}>This can take a few seconds after you complete payment.</Text>
          </>
        ) : granted ? (
          <>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.accent} />
            <Text style={styles.title}>You're in!</Text>
            <Text style={styles.sub}>Your pass is active. Enjoy the content.</Text>
            <View style={styles.actions}>
              {passId ? <Button label="Watch now" onPress={() => router.replace(`/watch/${passId}`)} /> : null}
              <Button label="Go to library" variant="secondary" onPress={() => router.replace('/library')} />
            </View>
          </>
        ) : (
          <>
            <Ionicons name="alert-circle" size={64} color="#f87171" />
            <Text style={styles.title}>We couldn't confirm payment</Text>
            <Text style={styles.sub}>If you completed checkout, it may still be processing. Check your library shortly.</Text>
            <View style={styles.actions}>
              <Button label="Retry" onPress={() => poll.refetch()} />
              <Button label="Go to library" variant="secondary" onPress={() => router.replace('/library')} />
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(8), gap: theme.spacing(3) },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: theme.spacing(2) },
  sub: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  actions: { alignSelf: 'stretch', gap: theme.spacing(3), marginTop: theme.spacing(6) },
});
