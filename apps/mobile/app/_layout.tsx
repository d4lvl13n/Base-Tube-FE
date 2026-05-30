import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { queryClient } from '../src/lib/query';
import { theme } from '../src/theme';
import { tokenCache } from '../src/lib/tokenCache';
import { setTokenGetter } from '../src/lib/auth';

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
    </Stack>
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
