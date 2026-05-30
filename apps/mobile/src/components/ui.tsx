import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

/** Full-screen padded container on the dark background. */
export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subtle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtle}>{children}</Text>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' ? styles.btnPrimary : styles.btnSecondary,
        (pressed || isDisabled) && styles.btnDim,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : theme.colors.text} />
      ) : (
        <Text style={[styles.btnText, variant === 'secondary' && styles.btnTextSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Tappable inline link text (e.g. "Sign up"). */
export function LinkText({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Text style={styles.link} onPress={onPress}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing(6) },
  heading: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  subtle: { color: theme.colors.textMuted, fontSize: 15, marginTop: theme.spacing(2), lineHeight: 21 },
  error: { color: '#f87171', fontSize: 14, marginTop: theme.spacing(2) },
  fieldWrap: { marginTop: theme.spacing(4) },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing(1.5) },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
  },
  btn: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: theme.colors.accent },
  btnSecondary: { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth },
  btnDim: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  btnTextSecondary: { color: theme.colors.text },
  link: { color: theme.colors.accent, fontWeight: '700' },
});
