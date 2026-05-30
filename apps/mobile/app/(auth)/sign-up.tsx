import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { Button, ErrorText, Field, Heading, Subtle } from '../../src/components/ui';
import { useGoogleOAuth } from '../../src/features/auth/oauth';
import { theme } from '../../src/theme';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const google = useGoogleOAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        // New accounts go through onboarding (handle/username) before the app.
        router.replace('/(app)/onboarding');
      } else {
        setError('Verification incomplete. Re-enter the code from your email.');
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Invalid or expired code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Text style={styles.brand}>
            Base<Text style={{ color: theme.colors.accent }}>Tube</Text>
          </Text>
        </View>

        {pendingVerification ? (
          <>
            <Heading>Verify your email</Heading>
            <Subtle>We sent a 6-digit code to {email}.</Subtle>
            <Field
              label="Verification code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              placeholder="123456"
            />
            <ErrorText>{error}</ErrorText>
            <View style={styles.actions}>
              <Button label="Verify & continue" onPress={onVerify} loading={busy} disabled={code.length < 6} />
            </View>
          </>
        ) : (
          <>
            <Heading>Create your account</Heading>
            <Subtle>Own what you watch. Support creators directly.</Subtle>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <ErrorText>{error ?? google.error}</ErrorText>
            <View style={styles.actions}>
              <Button label="Create account" onPress={onCreate} loading={busy} disabled={!email || !password} />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Button label="Continue with Google" variant="secondary" onPress={google.signInWithGoogle} loading={google.busy} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" style={styles.footerLink}>
                Sign in
              </Link>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(6), paddingTop: theme.spacing(16), flexGrow: 1 },
  brandRow: { marginBottom: theme.spacing(8) },
  brand: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  actions: { marginTop: theme.spacing(6) },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing(6) },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, marginHorizontal: theme.spacing(3) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing(8) },
  footerText: { color: theme.colors.textMuted },
  footerLink: { color: theme.colors.accent, fontWeight: '700' },
});
