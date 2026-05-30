import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** A tappable settings/profile list row with leading icon and chevron. */
export function Row({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? '#f87171' : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <Ionicons name={icon} size={20} color={destructive ? '#f87171' : theme.colors.textMuted} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      <View style={styles.right}>
        {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} /> : null}
      </View>
    </Pressable>
  );
}

export function RowGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: theme.spacing(6) },
  groupTitle: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: theme.spacing(2), marginLeft: theme.spacing(1) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), paddingHorizontal: theme.spacing(4), paddingVertical: theme.spacing(4), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  pressed: { backgroundColor: theme.colors.surfaceAlt },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), maxWidth: '50%' },
  value: { color: theme.colors.textMuted, fontSize: 14 },
});
