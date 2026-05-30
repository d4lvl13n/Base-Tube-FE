import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Button, ErrorText, Field, Heading, Subtle } from '../../src/components/ui';
import { AmbientGlow, Wordmark } from '../../src/components/primitives';
import { useGoogleOAuth } from '../../src/features/auth/oauth';
import { theme } from '../../src/theme';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const google = useGoogleOAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        // Root guard redirects into (app); fall back to an explicit replace.
        router.replace('/(app)');
      } else {
        setError('Additional verification required. Please continue on the web app.');
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Sign in failed. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <AmbientGlow height={360} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Wordmark size={28} />
        </View>

        <Heading>Welcome back</Heading>
        <Subtle>Sign in to your library, passes, and creators.</Subtle>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="••••••••"
        />

        <View style={styles.forgotRow}>
          <Link href="/(auth)/reset-password" style={styles.forgotLink}>Forgot password?</Link>
        </View>

        <ErrorText>{error ?? google.error}</ErrorText>

        <View style={styles.actions}>
          <Button label="Sign in" onPress={onSignIn} loading={busy} disabled={!email || !password} />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <Button label="Continue with Google" variant="secondary" onPress={google.signInWithGoogle} loading={google.busy} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to BaseTube? </Text>
          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            Create an account
          </Link>
        </View>

        <View style={styles.walletNote}>
          <Link href="/(auth)/wallet" style={styles.walletLink}>
            Sign in with a wallet
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(6), paddingTop: theme.spacing(16), flexGrow: 1 },
  brandRow: { marginBottom: theme.spacing(8) },
  brand: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  forgotRow: { alignItems: 'flex-end', marginTop: theme.spacing(3) },
  forgotLink: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  actions: { marginTop: theme.spacing(5) },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing(6) },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, marginHorizontal: theme.spacing(3) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing(8) },
  footerText: { color: theme.colors.textMuted },
  footerLink: { color: theme.colors.accent, fontWeight: '700' },
  walletNote: { alignItems: 'center', marginTop: theme.spacing(5) },
  walletLink: { color: theme.colors.textMuted, fontWeight: '600' },
});
