import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Heading, Screen, Subtle } from '../../src/components/ui';
import { theme } from '../../src/theme';

/**
 * Library (README screen 15) — owned passes & purchases. Wired to the
 * passes/purchases SDK modules in the passes phase; for now it presents the
 * empty state and routes to discovery.
 */
export default function LibraryScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'My library' }} />
      <Screen>
        <View style={styles.body}>
          <Heading>Your library</Heading>
          <Subtle>Passes you own and content you can watch will appear here.</Subtle>
        </View>
        <Button label="Explore passes" onPress={() => router.push('/discover')} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
});
