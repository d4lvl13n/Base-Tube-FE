import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Floating liquid-glass circular icon button (frosted BlurView + frost rim +
 * subtle specular highlight). The iOS-glass control for overlaying media.
 */
export function GlassCircleButton({
  icon,
  onPress,
  size = 40,
  style,
}: {
  icon: IoniconName;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        glassStyles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <BlurView tint="dark" intensity={36} style={StyleSheet.absoluteFill} />
      <View style={glassStyles.btnTint} />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Ionicons name={icon} size={size * 0.5} color="#fff" />
    </Pressable>
  );
}

/** Translucent frosted background for a floating tab bar (liquid glass). */
export function GlassBar({ tint = 'dark' as const }: { tint?: 'dark' | 'light' }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView tint={tint} intensity={50} style={StyleSheet.absoluteFill} />
      <View style={glassStyles.barTint} />
      <LinearGradient
        colors={theme.gradient.accentHairline}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={glassStyles.barHairline}
        pointerEvents="none"
      />
    </View>
  );
}

const glassStyles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
    ...theme.shadow.soft,
  },
  btnTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,12,0.28)' },
  barTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,6,0.55)' },
  barHairline: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
});

/** Thin orange→white gradient hairline — the premium accent line atop cards/sections. */
export function AccentHairline({ variant = 'accent', style }: { variant?: 'accent' | 'gold'; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={variant === 'gold' ? theme.gradient.goldHairline : theme.gradient.accentHairline}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.hairline, style]}
    />
  );
}

/** Near-black, frost-bordered card with large radius, deep shadow, optional top hairline. */
export function Card({
  children,
  style,
  hairline,
  hairlineVariant,
  padded,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hairline?: boolean;
  hairlineVariant?: 'accent' | 'gold';
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {hairline ? <AccentHairline variant={hairlineVariant} style={styles.cardHairline} /> : null}
      {children}
    </View>
  );
}

/** Frosted pill badge (uppercase micro-label). */
export function Pill({
  label,
  tone = 'frost',
  style,
}: {
  label: string;
  tone?: 'frost' | 'accent' | 'gold';
  style?: StyleProp<ViewStyle>;
}) {
  const toneStyle =
    tone === 'accent' ? styles.pillAccent : tone === 'gold' ? styles.pillGold : styles.pillFrost;
  const textTone =
    tone === 'accent' ? styles.pillTextAccent : tone === 'gold' ? styles.pillTextGold : styles.pillTextFrost;
  return (
    <View style={[styles.pill, toneStyle, style]}>
      <Text style={[styles.pillText, textTone]}>{label}</Text>
    </View>
  );
}

/** Ambient orange glow, anchored to the top of a screen/hero. Absolute-filled. */
export function AmbientGlow({ height = 280 }: { height?: number }) {
  return (
    <LinearGradient
      colors={theme.gradient.glow}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.glow, { height }]}
      pointerEvents="none"
    />
  );
}

/** Bottom-up dark scrim for legibility over imagery. */
export function Scrim({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={theme.gradient.scrim}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}

/** BaseTube wordmark with a gradient "Tube". */
export function Wordmark({ size = 24 }: { size?: number }) {
  const base: TextStyle = { fontSize: size, fontWeight: '800', letterSpacing: -0.5 };
  return (
    <View style={styles.wordmark}>
      <Text style={[base, { color: theme.colors.text }]}>Base</Text>
      <MaskedView maskElement={<Text style={[base, { color: '#000' }]}>Tube</Text>}>
        <LinearGradient colors={theme.gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[base, { opacity: 0 }]}>Tube</Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

/** Primary gradient (orange) button. */
export function GradientButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.9 : 1 }, style]}>
      <LinearGradient
        colors={theme.gradient.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradBtn}
      >
        <Text style={styles.gradBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Shimmering skeleton block for premium loading states. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  hairline: { height: 1.5, width: '100%' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  cardPadded: { padding: theme.spacing(4) },
  cardHairline: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1),
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillFrost: { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: theme.colors.border },
  pillAccent: { backgroundColor: theme.colors.accentSoft, borderColor: 'rgba(250,117,23,0.4)' },
  pillGold: { backgroundColor: 'rgba(242,201,76,0.14)', borderColor: 'rgba(242,201,76,0.4)' },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  pillTextFrost: { color: theme.colors.textMuted },
  pillTextAccent: { color: theme.colors.accentBright },
  pillTextGold: { color: theme.colors.gold },
  glow: { position: 'absolute', top: 0, left: 0, right: 0 },
  wordmark: { flexDirection: 'row', alignItems: 'center' },
  gradBtn: {
    height: 54,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradBtnText: { color: '#1a0c00', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  skeleton: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md },
});
