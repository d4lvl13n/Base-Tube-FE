import React from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { Wordmark } from './primitives';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface DrawerItem {
  label: string;
  icon: IconName;
  route: string;
}

const PANEL_WIDTH = 300;

// base.tube has no formal content-category taxonomy, so the menu surfaces the
// app's browse destinations plus Search + Settings (swap CATEGORIES for a real
// category list once one exists).
const CATEGORIES: DrawerItem[] = [
  { label: 'Home', icon: 'home-outline', route: '/' },
  { label: 'Discover', icon: 'compass-outline', route: '/discover' },
  { label: 'Subscriptions', icon: 'people-outline', route: '/subscriptions' },
  { label: 'Passes', icon: 'ticket-outline', route: '/passes' },
  { label: 'My Library', icon: 'albums-outline', route: '/library' },
];

const UTILITIES: DrawerItem[] = [
  { label: 'Search', icon: 'search-outline', route: '/search' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
];

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const anim = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(open);

  React.useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-PANEL_WIDTH, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const go = (route: string) => {
    onClose();
    router.push(route as never);
  };

  const renderItem = (item: DrawerItem) => (
    <Pressable
      key={item.route}
      onPress={() => go(item.route)}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Ionicons name={item.icon} size={20} color={theme.colors.textMuted} />
      <Text style={styles.itemLabel}>{item.label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdropAnim, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.panel, { paddingTop: insets.top + theme.spacing(3), transform: [{ translateX }] }]}>
          <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
          <View style={styles.panelTint} />
          <View style={styles.brandRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Wordmark size={22} />
          </View>
          <LinearGradient
            colors={theme.gradient.accentHairline}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.hairline}
            pointerEvents="none"
          />
          <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing(6) }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {CATEGORIES.map(renderItem)}
            <View style={styles.divider} />
            {UTILITIES.map(renderItem)}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdropAnim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    overflow: 'hidden',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.border,
    ...theme.shadow.card,
  },
  panelTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,10,0.86)' },
  flex: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    paddingHorizontal: theme.spacing(5),
    paddingBottom: theme.spacing(4),
  },
  logo: { width: 30, height: 30 },
  hairline: { height: 1, marginHorizontal: theme.spacing(5), marginBottom: theme.spacing(3) },
  sectionTitle: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing(5),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(4),
    paddingHorizontal: theme.spacing(5),
    paddingVertical: theme.spacing(3.5),
  },
  itemPressed: { backgroundColor: theme.colors.surfaceAlt },
  itemLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: theme.spacing(3), marginHorizontal: theme.spacing(5) },
});
