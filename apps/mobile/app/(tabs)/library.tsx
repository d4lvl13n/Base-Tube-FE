import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={48} color={theme.colors.textMuted} />
      <Text style={styles.title}>Your Library</Text>
      <Text style={styles.body}>
        Sign in to access your content passes, purchases, and watch history.
      </Text>
      <Text style={styles.note}>
        Auth (Clerk + wallet) and the pass library land in phase 2.
      </Text>
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
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginTop: theme.spacing(4) },
  body: { color: theme.colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: theme.spacing(3) },
  note: { color: theme.colors.accent, fontSize: 13, textAlign: 'center', marginTop: theme.spacing(5) },
});
