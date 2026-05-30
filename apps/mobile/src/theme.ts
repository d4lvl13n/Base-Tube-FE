/**
 * Premium dark design tokens — mirrors the web app's Resend-inspired aesthetic:
 * near-black surfaces, icy frost borders, orange accent + gradient hairlines,
 * large radii, and deep cinematic shadows.
 */
export const theme = {
  colors: {
    background: '#050506',     // theatrical near-black canvas
    surface: '#0c0c0e',        // card base
    surfaceAlt: '#141417',     // inputs, raised chips
    elevated: '#161619',
    // Icy blue-tinted frost borders — the signature premium detail.
    border: 'rgba(214,235,253,0.12)',
    borderStrong: 'rgba(214,235,253,0.20)',
    text: '#f4f5f7',
    textMuted: '#9a9aa4',
    textFaint: '#65656e',
    accent: '#fa7517',
    accentBright: '#ff9d4d',
    accentSoft: 'rgba(250,117,23,0.16)',
    gold: '#f2c94c',
    success: '#34d399',
    danger: '#ff5a63',
    overlay: 'rgba(0,0,0,0.55)',
  },
  /** Gradient stop arrays for expo-linear-gradient. */
  gradient: {
    brand: ['#ff8a2b', '#fa7517', '#f25f00'] as const,
    accentHairline: ['transparent', 'rgba(250,117,23,0.85)', 'rgba(255,255,255,0.35)', 'transparent'] as const,
    goldHairline: ['transparent', 'rgba(242,201,76,0.8)', 'transparent'] as const,
    // Vertical scrim for legibility over imagery (top transparent → dark bottom).
    scrim: ['rgba(5,5,6,0)', 'rgba(5,5,6,0.55)', 'rgba(5,5,6,0.95)'] as const,
    // Ambient orange glow (top-down), used behind hero / headers.
    glow: ['rgba(250,117,23,0.18)', 'rgba(250,117,23,0.04)', 'transparent'] as const,
  },
  radius: { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 },
  spacing: (n: number) => n * 4,
  /** Cinematic card elevation. */
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 16 },
      elevation: 12,
    },
    soft: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  },
} as const;
