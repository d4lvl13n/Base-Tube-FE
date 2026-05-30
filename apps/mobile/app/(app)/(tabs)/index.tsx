import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../src/components/ui';
import { theme } from '../../../src/theme';

/**
 * Home feed (README screen 4). Placeholder for the auth phase — the real feed
 * (videos.getFeatured / getTrending + channels.popular) lands in the
 * core-consumer phase.
 */
export default function HomeScreen() {
  return (
    <Screen>
      <Text style={styles.brand}>
        Base<Text style={{ color: theme.colors.accent }}>Tube</Text>
      </Text>
      <View style={styles.body}>
        <Text style={styles.muted}>You're signed in. Home feed coming next.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { color: theme.colors.text, fontSize: 26, fontWeight: '800', marginTop: theme.spacing(4) },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.textMuted, fontSize: 15 },
});
