import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { ME_QUERY_KEY, queryClient } from '../src/lib/query';
import { theme } from '../src/theme';
import { tokenCache } from '../src/lib/tokenCache';
import { setTokenGetter } from '../src/lib/auth';
import { api } from '../src/lib/client';
import {
  markAccountScreenPresented,
  setAccountSession,
  useAccountStatus,
} from '../src/lib/accountStatus';

// react-navigation (and expo-router) default to a LIGHT theme whose scene
// background is white. Override so scenes are dark by default.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.background,
    border: theme.colors.border,
    text: theme.colors.text,
    primary: theme.colors.accent,
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = theme.colors.background;
  document.body.style.backgroundColor = theme.colors.background;
}

/** Registers the live Clerk session-token getter with the SDK client bridge. */
function AuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

/**
 * Suspended / banned account (403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED, reported
 * by the SDK client through src/lib/accountStatus.ts): opens the
 * "Account suspended" screen once, never for a signed-out app, and resets on
 * every sign-out / sign-in. The account query below finds out on launch, and
 * re-checks when the app comes back to the foreground while restricted, so a
 * restored account clears itself.
 */
function AccountGate() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const status = useAccountStatus();
  const sessionUser = isLoaded && isSignedIn ? userId ?? null : null;

  useEffect(() => {
    setAccountSession(sessionUser);
  }, [sessionUser]);

  const account = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.profile.me(),
    enabled: !!sessionUser,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const recheck = account.refetch;

  useEffect(() => {
    if (!sessionUser || !status.restriction || status.presented || status.dismissed) return;
    markAccountScreenPresented();
    router.push('/account-suspended');
  }, [sessionUser, status, router]);

  useEffect(() => {
    if (!sessionUser || !status.restriction) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') recheck();
    });
    return () => sub.remove();
  }, [sessionUser, status.restriction, recheck]);

  return null;
}

/** Routes unauthenticated users to the auth group and authed users into the app. */
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (isSignedIn && inAuthGroup) {
      router.replace('/(app)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <AccountGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="account-suspended" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  if (!publishableKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in apps/mobile/.env (pairs with the backend Clerk instance).'
    );
  }

  const content = (
    <ClerkLoaded>
      <AuthBridge />
      {Platform.OS === 'web' ? (
        <View style={styles.webShell}>
          <View style={styles.webFrame}>
            <InitialLayout />
          </View>
        </View>
      ) : (
        <InitialLayout />
      )}
    </ClerkLoaded>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider value={navTheme}>
            <StatusBar style="light" />
            {content}
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  webShell: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.background },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: theme.colors.background,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});
