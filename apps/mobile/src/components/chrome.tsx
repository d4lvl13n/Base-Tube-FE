import React from 'react';
import {
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Wordmark } from './primitives';
import { SideMenu } from './drawer';

/** Bare header height (below the status bar). Screens pad their content by this + the inset. */
export const HEADER_HEIGHT = 54;

interface ChromeValue {
  /** 0 = header fully shown, 1 = fully hidden. Native-driver friendly. */
  progress: Animated.Value;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ChromeContext = React.createContext<ChromeValue | null>(null);

/** Provides the shared scroll→header reveal/hide state to the tab screens. */
export function ScrollChromeProvider({ children }: { children: React.ReactNode }) {
  const progress = React.useRef(new Animated.Value(0)).current;
  const lastY = React.useRef(0);
  const hidden = React.useRef(false);

  const animate = React.useCallback(
    (hide: boolean) => {
      if (hidden.current === hide) return;
      hidden.current = hide;
      Animated.spring(progress, {
        toValue: hide ? 1 : 0,
        useNativeDriver: true,
        stiffness: 220,
        damping: 26,
        mass: 0.9,
      }).start();
    },
    [progress]
  );

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y <= 8) {
        lastY.current = y;
        animate(false);
        return;
      }
      const dy = y - lastY.current;
      lastY.current = y;
      if (dy > 8) animate(true);
      else if (dy < -8) animate(false);
    },
    [animate]
  );

  const value = React.useMemo(() => ({ progress, onScroll }), [progress, onScroll]);
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useScrollChrome() {
  const ctx = React.useContext(ChromeContext);
  if (!ctx) throw new Error('useScrollChrome must be used within a ScrollChromeProvider');
  return ctx;
}

/**
 * Pinned brand app-bar (logo + wordmark) that slides up / fades out on scroll-down
 * and reappears on scroll-up. Rendered once as an overlay above the tab content.
 */
export function AppHeader({ right }: { right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ctx = React.useContext(ChromeContext);
  const progress = ctx?.progress ?? new Animated.Value(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(HEADER_HEIGHT + insets.top + 12)],
  });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <>
      <Animated.View style={[styles.header, { paddingTop: insets.top, transform: [{ translateY }], opacity }]}>
        <BlurView tint="dark" intensity={42} style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={[styles.row, { height: HEADER_HEIGHT }]}>
          <View style={styles.brand}>
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </Pressable>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Wordmark size={20} />
          </View>
          <View style={styles.right}>
            <Pressable
              onPress={() => router.push('/search' as never)}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={22} color={theme.colors.text} />
            </Pressable>
            {right}
          </View>
        </View>
        <LinearGradient
          colors={theme.gradient.accentHairline}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hairline}
          pointerEvents="none"
        />
      </Animated.View>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    overflow: 'hidden',
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,6,0.72)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(4),
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  logo: { width: 30, height: 30 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  hairline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1 },
});
