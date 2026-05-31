import * as Haptics from 'expo-haptics';

/**
 * Thin, fire-and-forget haptics wrappers. Every call is best-effort and
 * swallows errors so unsupported devices / the simulator never throw.
 *
 * Convention:
 *  - selection : navigation / lightweight taps (tabs, menu, share)
 *  - light/medium : a committed action (like / subscribe)
 *  - success/warning : a confirmed outcome (comment posted, etc.)
 */
export const haptics = {
  selection: () => {
    Haptics.selectionAsync().catch(() => {});
  },
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
