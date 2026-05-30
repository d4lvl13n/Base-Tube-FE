import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../src/lib/client';
import { theme } from '../src/theme';

/**
 * Minimal app shell. The demo screens were intentionally removed; the real
 * v1 screens (see README) are built on top of this shell + the @basetube/api
 * SDK. This landing only confirms the app boots and the SDK is configured.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        Base<Text style={{ color: theme.colors.accent }}>Tube</Text>
      </Text>
      <Text style={styles.subtitle}>Mobile app shell</Text>
      <Text style={styles.note}>
        SDK wired ({'@basetube/api'}). v1 screens are scaffolded next — see
        README for the screen list.
      </Text>
      <Text style={styles.api}>API: {API_BASE_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(8),
  },
  brand: { color: theme.colors.text, fontSize: 34, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: 16, marginTop: theme.spacing(2) },
  note: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing(5),
    lineHeight: 20,
  },
  api: { color: theme.colors.border, fontSize: 12, marginTop: theme.spacing(6) },
});
