import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Sleek, right-adjusted floating tab bar (Reddit-style minimalism): a compact
 * glass pill of icon-only buttons aligned to the bottom-right. Active tab gets a
 * filled orange disc; inactive tabs are bare glyphs. Search + the rest live in
 * the top bar / side menu, so only the 3 primary destinations sit here.
 */
const TAB_ICONS: Record<string, { on: IconName; off: IconName }> = {
  index: { on: 'home', off: 'home-outline' },
  discover: { on: 'compass', off: 'compass-outline' },
  profile: { on: 'person-circle', off: 'person-circle-outline' },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        <BlurView tint="dark" intensity={55} style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const icons = TAB_ICONS[route.name];
            if (!icons) return null; // search / non-primary routes aren't in the bar
            const focused = state.index === index;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                hitSlop={6}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && styles.pressed]}
              >
                <Ionicons name={focused ? icons.on : icons.off} size={24} color={focused ? '#1a0c00' : theme.colors.text} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'flex-end', // right-adjusted
    paddingRight: theme.spacing(4),
  },
  pill: {
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,6,0.70)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.5),
  },
  item: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  pressed: { opacity: 0.65 },
});
