import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { theme } from '../../../src/theme';

/**
 * Consumer tab bar. Home + Profile are live; Discover and Search are added in
 * the core-consumer phase (README screens 5–6).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          ...(Platform.OS === 'web' ? { height: 56 } : {}),
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
