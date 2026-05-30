/** Shared design tokens mirroring the web app's dark theme + base-orange accent. */
export const theme = {
  colors: {
    background: '#09090B',
    surface: '#161618',
    surfaceAlt: '#1f1f23',
    border: '#27272a',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    accent: '#fa7517',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  spacing: (n: number) => n * 4,
} as const;
