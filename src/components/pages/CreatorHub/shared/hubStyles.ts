/**
 * The Creator Hub's visual vocabulary, gathered in one place so the pass
 * screens (wizard, list, detail) speak the same language as Content Studio,
 * the Videos list and the sidebar — instead of the styled-components dialect
 * they used to carry.
 *
 * Two registers live here on purpose:
 *
 *  - `form` / `list` / `statusPill`: the hub's working register. `#0f0f0f`
 *    panels, hairline `gray-800/60` borders, 12–14 px type, `bg-white/5`
 *    fields, orange spent on exactly ONE action per screen.
 *  - `editorial`: the public pass page's register (frost borders, fluid
 *    `clamp()` headings, 0.3em eyebrows, a white pill CTA). Reserved for the
 *    moments that earn ceremony — the publish step and the success screen.
 *
 * Nothing in here is new: every value is lifted from a surface that already
 * ships. If you need a token that is not here, it probably belongs in the
 * source sheet first (`VideosManagement/EditVideoModal/styles.ts`,
 * `VideosManagement/components/VideoList/styles.ts`).
 */
import { styles as formStyles, statusPill } from '../VideosManagement/EditVideoModal/styles';
import { styles as listStyles } from '../VideosManagement/components/VideoList/styles';

export const form = formStyles;
export const list = listStyles;
export { statusPill };

/** Hub accent. The public pass page uses `#ff801f`; the hub is `#fa7517` everywhere. */
export const ACCENT = '#fa7517';
export const ACCENT_HOVER = '#ff8c3a';

/** Page frame shared by Videos management (`pt-24`, wide measure) and the pass screens. */
export const page = {
  frame: 'relative pt-24 pb-12 text-white',
  /** Management surfaces (list/detail) use the wide measure; the wizard uses `narrow`. */
  wide: 'mx-auto max-w-[1600px] space-y-4 px-4 md:px-6',
  narrow: 'mx-auto max-w-4xl space-y-4 px-4 md:px-6',
  /** `<header>`: title left, actions right, both top-aligned. */
  header: 'flex items-start justify-between gap-6',
  title: 'text-2xl font-semibold tracking-tight text-white',
  /** `· 12` after the title, as the Videos toolbar does. */
  titleCount: 'ml-1.5 font-normal tabular-nums text-gray-500',
  subtitle: 'mt-1 text-sm text-gray-500',
  /** Micro-label above a group: the hub's only "section heading". */
  eyebrow: 'text-[11px] font-medium uppercase tracking-wider text-gray-500',
};

/** Segmented control (Videos toolbar): trough + chips. Use for price presets, currency, settlement. */
export const segmented = {
  trough: 'inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-800/60 bg-white/5 p-0.5',
  chip: `
    inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium
    transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
  `,
  chipActive: 'bg-[#fa7517]/15 text-[#fa7517]',
  chipIdle: 'text-gray-400 hover:bg-white/5 hover:text-white',
};

/** A pass's lifecycle in three words, like the video status vocabulary. */
export const passStatusPill = {
  base: statusPill.base,
  draft: 'border-gray-700 bg-white/5 text-gray-400',
  live: statusPill.processed,
  paused: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
  failed: statusPill.failed,
  publishing: statusPill.processing,
};

/** Tier is metadata, not decoration: one neutral pill, the tier as text. */
export const tierPill = 'inline-flex items-center rounded-full border border-gray-800/60 bg-white/5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-gray-400';

/** 1 px hairline progress (supply sold), as on the public pass page. */
export const hairlineBar = {
  track: 'h-px w-full bg-white/[0.06]',
  fill: 'h-px bg-[#fa7517] transition-[width] duration-700 ease-out motion-reduce:transition-none',
};

/** Selectable card (video picker, settlement choice): one border, one ring, no lift. */
export const selectable = {
  base: `
    relative overflow-hidden rounded-lg border bg-white/[0.02] text-left transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
  `,
  idle: 'border-gray-800/60 hover:border-gray-700 hover:bg-white/[0.04]',
  active: 'border-[#fa7517]/60 bg-[#fa7517]/[0.06]',
};

/** Skeleton blocks (Videos list). Never a full-height grey slab. */
export const skeleton = {
  block: 'animate-pulse rounded bg-white/5',
  thumb: 'aspect-video w-full animate-pulse rounded-lg bg-white/5',
  line: 'h-3.5 animate-pulse rounded bg-white/5',
};

/** The wizard's own stepper: a hairline rail, the active step in text, done steps muted. */
export const stepper = {
  rail: 'flex items-center gap-2 border-b border-gray-800/60 pb-3',
  step: 'inline-flex items-center gap-2 text-xs font-medium tracking-wide transition-colors',
  stepActive: 'text-white',
  stepDone: 'text-gray-400 hover:text-white',
  stepTodo: 'text-gray-600',
  index: 'inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] tabular-nums',
  indexActive: 'border-[#fa7517]/60 bg-[#fa7517]/15 text-[#fa7517]',
  indexDone: 'border-gray-700 bg-white/5 text-gray-400',
  indexTodo: 'border-gray-800 text-gray-600',
  separator: 'h-px w-6 bg-gray-800/60',
};

/**
 * The public pass page's register (`src/pages/PassDetailsPage.tsx`), for the
 * publish step and the success screen only.
 */
export const editorial = {
  frostBorder: 'border-[rgba(214,235,253,0.19)]',
  frostBorderAlt: 'border-[rgba(217,237,254,0.145)]',
  textPrimary: 'text-[#f0f0f0]',
  textSecondary: 'text-[#a1a4a5]',
  textTertiary: 'text-[#5c5c5c]',
  /** Whispered label above a masthead. Pair with `style={{ letterSpacing: '0.3em' }}`. */
  eyebrow: 'text-xs uppercase text-[#5c5c5c]',
  /** Masthead. Pair with `style={editorial.mastheadStyle}`. */
  masthead: 'font-medium text-[#f0f0f0]',
  mastheadStyle: { fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.05, letterSpacing: '-0.035em' } as const,
  /** Metadata strip under a masthead. Pair with `style={{ letterSpacing: '0.16em' }}`. */
  strip: 'flex items-center gap-6 text-xs uppercase text-[#a1a4a5]',
  panel: 'relative overflow-hidden rounded-3xl border border-[rgba(214,235,253,0.19)]',
  /** The one warm thing on the page: an 8 %-alpha radial glow, blurred out. */
  glowStyle: {
    background: 'radial-gradient(ellipse at center, #fa751714 0%, transparent 70%)',
    filter: 'blur(40px)',
  } as const,
  primaryButton: `
    inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm
    font-medium tracking-tight text-black transition-colors hover:bg-white/90
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  secondaryButton: `
    inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(214,235,253,0.19)]
    bg-transparent px-6 py-3 text-sm font-medium tracking-tight text-[#f0f0f0] transition-colors
    hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50
  `,
  divider: 'border-t border-[rgba(217,237,254,0.145)]',
  easeOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/** framer-motion variants shared by both registers. Respect `useReducedMotion()` at the call site. */
export const motionPresets = {
  fadeUp: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: editorial.easeOut } },
  },
  fadeUpSmall: {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: editorial.easeOut } },
  },
  stepSlide: {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: editorial.easeOut } },
    exit: { opacity: 0, x: -12, transition: { duration: 0.18 } },
  },
};

/** `cn` without a dependency: joins truthy class fragments, collapses the template whitespace. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
