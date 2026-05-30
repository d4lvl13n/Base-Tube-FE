import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Button, ErrorText, Field, Heading, LinkText, Subtle } from '../../src/components/ui';
import { theme } from '../../src/theme';

/**
 * Onboarding (README screen 3) — pick a handle. Sets the Clerk username (synced
 * to the backend via the Clerk webhook). Skippable; users can set it later in
 * settings. The web3 onboarding variant (web3auth.username) is added with wallet
 * auth once the backend bearer change lands (Brief G.1).
 */
export default function OnboardingScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState(user?.username ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = () => router.replace('/');

  const onContinue = async () => {
    const handle = username.trim();
    if (!handle) {
      finish();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await user?.update({ username: handle });
      finish();
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'That handle is unavailable. Try another.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Heading>Choose your handle</Heading>
          <Subtle>This is how creators and the community will see you.</Subtle>
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="yourname"
          />
          <ErrorText>{error}</ErrorText>
        </View>

        <View style={styles.bottom}>
          <Button label="Continue" onPress={onContinue} loading={busy} />
          <View style={styles.skip}>
            <LinkText onPress={finish}>Skip for now</LinkText>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing(6), paddingTop: theme.spacing(20) },
  top: { flex: 1 },
  bottom: { paddingBottom: theme.spacing(8) },
  skip: { alignItems: 'center', marginTop: theme.spacing(4) },
});
