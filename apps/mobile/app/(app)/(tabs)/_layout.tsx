import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: IconName, unfocused: IconName) {
  return ({ color, focused: isFocused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size ?? 22} color={color} />
  );
}

/** Consumer tab bar: Home, Discover, Search, Profile. */
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
          ...(Platform.OS === 'web' ? { height: 58 } : {}),
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: tabIcon('compass', 'compass-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
