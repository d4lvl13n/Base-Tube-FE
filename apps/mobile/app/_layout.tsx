import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../src/lib/query';
import { theme } from '../src/theme';

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

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = theme.colors.background;
  document.body.style.backgroundColor = theme.colors.background;
}

export default function RootLayout() {
  const stack = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          {/* On web, constrain to a phone-width frame centred on the dark page. */}
          {Platform.OS === 'web' ? (
            <View style={styles.webShell}>
              <View style={styles.webFrame}>{stack}</View>
            </View>
          ) : (
            stack
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
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
