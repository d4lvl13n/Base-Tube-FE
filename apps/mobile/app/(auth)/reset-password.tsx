import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Button, ErrorText, Field, Heading, Subtle } from '../../src/components/ui';
import { AmbientGlow, Wordmark } from '../../src/components/primitives';
import { theme } from '../../src/theme';

/**
 * Forgot / reset password — Clerk's `reset_password_email_code` strategy:
 * request a code to the email, then submit code + new password to complete and
 * sign in. Parity with the web hosted sign-in's "forgot password" path.
 */
export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
      setPending(true);
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Could not send a reset code.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(app)');
      } else {
        setError('Additional verification is required — please finish on the web app.');
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Invalid or expired code.');
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

        {pending ? (
          <>
            <Heading>Set a new password</Heading>
            <Subtle>Enter the code we emailed to {email} and choose a new password.</Subtle>
            <Field label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" placeholder="123456" />
            <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" />
            <ErrorText>{error}</ErrorText>
            <View style={styles.actions}>
              <Button label="Reset password" onPress={resetPassword} loading={busy} disabled={code.length < 6 || password.length < 8} />
            </View>
          </>
        ) : (
          <>
            <Heading>Reset your password</Heading>
            <Subtle>We'll email you a code to reset it.</Subtle>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <ErrorText>{error}</ErrorText>
            <View style={styles.actions}>
              <Button label="Send reset code" onPress={requestCode} loading={busy} disabled={!email} />
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remembered it? </Text>
          <Link href="/(auth)/sign-in" style={styles.footerLink}>Back to sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(6), paddingTop: theme.spacing(16), flexGrow: 1 },
  brandRow: { marginBottom: theme.spacing(8) },
  actions: { marginTop: theme.spacing(6) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing(8) },
  footerText: { color: theme.colors.textMuted },
  footerLink: { color: theme.colors.accent, fontWeight: '700' },
});
