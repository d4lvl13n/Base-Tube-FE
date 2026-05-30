import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme';
import { GlassBar } from '../../../src/components/primitives';

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
        headerTransparent: false,
        // Floating liquid-glass tab bar: translucent, content scrolls beneath.
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => <GlassBar />,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: tabIcon('compass', 'compass-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
