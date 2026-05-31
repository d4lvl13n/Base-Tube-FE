import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../../src/components/floating-tab-bar';

/** Consumer tabs: Home, Discover, Search, Profile — with a floating glass pill bar. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Search moved to the top bar + side menu; route stays for navigation. */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
