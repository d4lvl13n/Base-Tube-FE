/**
 * The Creator Hub's visual vocabulary (Business, passes, the pass wizard, Videos,
 * channels, uploads), built on the Analytics cards (StatsCard,
 * AnalyticsDashboard, DetailedVideoPerformanceTab) so the hub reads as one product:
 *
 *  - surfaces are translucent BLACK on the hub's #09090B (`bg-black/50`), never
 *    a lighter grey fill; depth comes from a hairline cool border, the faint
 *    orange sheen (`from-[#fa751708]`) and, on the one hero card per screen,
 *    the Analytics orange glow;
 *  - 12 px radius (`rounded-xl`) for cards, 8 px for things inside them;
 *  - numbers are bold, tight and tabular; labels are small, sentence case,
 *    `gray-400` (AA on black: about 8:1); `gray-500` only for decoration;
 *  - orange (#fa7517) marks the hero number's icon, the active tab / chip, the
 *    one primary action and the data that matters in a chart. Nothing else.
 *
 * The older grey register (`shared/hubStyles.ts`: #0f0f0f panels, bg-white/5
 * fields, uppercase micro-labels) is retired; do not bring those values back.
 */

export const ACCENT = '#fa7517';
export const ACCENT_HOVER = '#ff8c3a';

/** `cn` without a dependency: joins truthy class fragments, collapses whitespace. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50';

// --- Surfaces -------------------------------------------------------------------------

export const surface = {
  /** The Analytics card: translucent black on the page, hairline cool border. */
  card: 'relative min-w-0 overflow-hidden rounded-xl border border-gray-800/50 bg-black/50',
  /** A block inside a card (a nested group, a code field). */
  inset: 'rounded-lg border border-gray-800/50 bg-black/40',
  /** Hairline colour for dividers inside a card. */
  hairline: 'border-gray-800/50',
  divider: 'divide-y divide-gray-800/50',
};

/** The faint diagonal orange wash every Analytics card container carries. Put it first in a `relative` card. */
export const sheen = 'pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent';

/** The Analytics tab container's glow, a touch softer: for the ONE hero card of a screen. */
export const heroGlow = {
  boxShadow:
    '0 0 20px 4px rgba(250, 117, 23, 0.08), 0 0 40px 10px rgba(250, 117, 23, 0.035), inset 0 0 60px 15px rgba(250, 117, 23, 0.025)',
} as const;

// --- Type -------------------------------------------------------------------------------

export const text = {
  /** Page title (Analytics: `text-2xl font-bold`). */
  pageTitle: 'text-2xl font-bold tracking-tight text-white',
  pageSubtitle: 'mt-1 text-sm text-gray-400',
  /** A card's own title. */
  cardTitle: 'text-base font-semibold text-white',
  /** What a number is (StatsCard title). */
  label: 'text-sm text-gray-400',
  /** The money a screen is about. */
  hero: 'text-4xl font-bold leading-none tracking-tight tabular-nums text-white sm:text-5xl',
  /** A secondary number (StatsCard value). */
  value: 'text-2xl font-bold tabular-nums text-white',
  /** A number inside a list or table. */
  figure: 'text-sm font-semibold tabular-nums text-white',
  /** A line under a value. */
  sub: 'text-sm text-gray-400',
  /** Small print that still has to be read. */
  note: 'text-xs leading-relaxed text-gray-400',
  /** Inline link. */
  link: `text-[#fa7517] transition-colors hover:text-[#ff8c3a] ${focusRing} rounded-sm`,
};

// --- Controls ---------------------------------------------------------------------------

export const button = {
  primary: `
    inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#fa7517] px-3.5 text-sm
    font-medium text-black transition-colors hover:bg-[#ff8c3a] disabled:cursor-not-allowed
    disabled:bg-white/[0.06] disabled:text-gray-500 ${focusRing} focus-visible:ring-offset-2 focus-visible:ring-offset-black
  `,
  secondary: `
    inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-800 bg-black/40 px-3
    text-sm text-gray-200 transition-colors hover:border-gray-700 hover:bg-white/[0.03] hover:text-white
    disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}
  `,
  ghost: `
    inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm text-gray-400 transition-colors
    hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}
  `,
  danger: `
    inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-500/90 px-4 text-sm font-medium
    text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60
  `,
  /** Small text action inside a row (Check again, Remove…). */
  small: `
    inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition-colors
    disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}
  `,
  /** Square icon button (row actions, copy). */
  icon: `
    inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors
    hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${focusRing}
  `,
};

export const field = {
  label: 'block text-xs font-medium text-gray-400',
  input: `
    h-9 w-full rounded-lg border border-gray-800 bg-black/40 px-3 text-sm text-gray-100 transition-colors
    placeholder:text-gray-500 hover:border-gray-700 focus-visible:border-[#fa7517]/50 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-[#fa7517]/30
  `,
  error: 'text-xs text-red-300',
};

/** Segmented control: period presets, filters. */
export const segmented = {
  trough: 'inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-800/60 bg-black/40 p-0.5',
  chip: `inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors ${focusRing}`,
  chipActive: 'bg-[#fa7517]/15 text-[#fa7517]',
  chipIdle: 'text-gray-400 hover:bg-white/[0.04] hover:text-white',
};

// --- Pills: one small set, five tones -------------------------------------------------------

export type PillTone = 'positive' | 'attention' | 'negative' | 'neutral' | 'accent';

export const pill = {
  base: 'inline-flex max-w-full shrink-0 items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-medium',
  positive: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  attention: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  negative: 'border-red-500/25 bg-red-500/10 text-red-300',
  neutral: 'border-gray-800 bg-black/40 text-gray-300',
  accent: 'border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fa7517]',
};

export const pillClass = (tone: PillTone, extra?: string): string => cx(pill.base, pill[tone], extra);

// --- Tables -------------------------------------------------------------------------------

/** DetailedVideoPerformanceTab's table: sentence-case grey header, hairline rows, right-aligned tabular numbers. */
export const table = {
  head: 'border-b border-gray-800/70',
  th: 'whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-400',
  row: 'group transition-colors duration-150 hover:bg-white/[0.025]',
  td: 'px-4 py-3.5 align-middle',
  num: 'text-right tabular-nums',
  body: 'divide-y divide-gray-800/50',
};

// --- Loading -------------------------------------------------------------------------------

export const skeleton = {
  block: 'animate-pulse rounded-md bg-white/[0.05] motion-reduce:animate-none',
  line: 'h-3.5 animate-pulse rounded bg-white/[0.05] motion-reduce:animate-none',
  thumb: 'aspect-video w-full animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none',
};

// --- Frame -----------------------------------------------------------------------------------

export const frame = {
  page: 'relative pt-24 pb-16 text-white',
  /** The Analytics measure (channels, resources). */
  wide: 'mx-auto max-w-7xl space-y-6 px-4 md:px-6',
  /**
   * Business screens and the pass pages only: fluid up to 1600 px, so a wide
   * monitor shows currencies, panels and tables side by side. Same side
   * padding as `wide` (the pass page's sticky bar bleeds by exactly that).
   */
  business: 'mx-auto w-full max-w-[1600px] space-y-6 px-4 md:px-6',
};

/** Empty and error states: one icon, one sentence, one action. */
export const empty = {
  wrapper: 'flex flex-col items-center justify-center px-6 py-14 text-center',
  icon: 'flex h-12 w-12 items-center justify-center rounded-full border border-gray-800/70 bg-black/60 text-[#fa7517]',
  title: 'mt-4 text-base font-semibold text-white',
  body: 'mt-1 max-w-md text-sm text-gray-400',
};

/** Supply sold: a thin bar, the pass page's hairline made readable. */
export const meter = {
  track: 'h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]',
  fill: 'h-full rounded-full bg-[#fa7517] transition-[width] duration-700 ease-out motion-reduce:transition-none',
};

/** A quiet note that is not an error: hairline border on black, readable grey text. */
export const note = {
  neutral: 'flex items-start gap-2 rounded-lg border border-gray-800/60 bg-black/40 p-3 text-xs leading-relaxed text-gray-300',
  attention: 'flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-200',
};

/** A card you pick (video picker, payout choice, preset): one border, one ring, no lift, no grey fill. */
export const selectable = {
  base: `
    relative overflow-hidden rounded-lg border bg-black/40 text-left transition-colors
    ${focusRing} focus-visible:ring-offset-2 focus-visible:ring-offset-black
  `,
  idle: 'border-gray-800/70 hover:border-gray-700 hover:bg-white/[0.025]',
  active: 'border-[#fa7517]/60 bg-[#fa7517]/[0.06]',
};

/** A wizard's stepper: where you are (orange), what is done (a check), what is left (dim but readable). */
export const stepper = {
  rail: 'flex items-center gap-1.5 overflow-x-auto pb-1',
  step: 'inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2 text-sm transition-colors',
  stepActive: 'font-medium text-white',
  stepDone: `text-gray-300 hover:bg-white/[0.04] hover:text-white ${focusRing}`,
  stepTodo: 'text-gray-500',
  index: 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
  indexActive: 'border-[#fa7517] bg-[#fa7517] text-black',
  indexDone: 'border-[#fa7517]/40 bg-[#fa7517]/10 text-[#fa7517]',
  indexTodo: 'border-gray-800 text-gray-500',
  separator: 'h-px w-4 shrink-0 bg-gray-800 sm:w-8',
  separatorDone: 'h-px w-4 shrink-0 bg-[#fa7517]/40 sm:w-8',
};

/** A dark tooltip / menu panel (Radix content). */
export const popover = {
  panel: 'z-50 rounded-lg border border-gray-800 bg-black px-2.5 py-1.5 text-xs text-gray-200 shadow-[0_16px_40px_rgba(0,0,0,0.7)]',
  menu: 'z-50 min-w-[11rem] overflow-hidden rounded-xl border border-gray-800 bg-black p-1 shadow-[0_24px_60px_rgba(0,0,0,0.7)]',
  item: `
    flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-200 outline-none transition-colors
    data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white data-[disabled]:opacity-50
  `,
};

/** The dialog sheet (confirmations, edit details, the video drawer). */
export const sheet = {
  overlay: 'fixed inset-0 z-[90] bg-black/80',
  dialog:
    'fixed left-1/2 top-1/2 z-[91] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-800/70 bg-black p-6 text-white shadow-[0_32px_80px_rgba(0,0,0,0.8)] focus:outline-none',
  title: 'text-lg font-semibold tracking-tight text-white',
};

// --- The pass screens' names, in this register ---------------------------------------------
// The names the pass and video screens use (`form`, `list`, `page`…), with the values above.

export const page = {
  frame: frame.page,
  wide: frame.wide,
  header: 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
  title: text.pageTitle,
  titleCount: 'ml-2 font-normal tabular-nums text-gray-500',
  subtitle: text.pageSubtitle,
  /** A small group label (sentence case, like the Analytics card titles). */
  eyebrow: 'text-sm text-gray-400',
};

export const form = {
  page: 'pb-12 text-white',
  /** The pass page's bar: on the page colour, not a grey slab. */
  header: `
    sticky top-24 z-30 -mx-4 mb-6 flex h-14 items-center gap-3 border-b border-gray-800/50
    bg-[#09090B]/95 px-4 backdrop-blur-md md:-mx-6 md:px-6
  `,
  ghostButton: button.ghost,
  primaryButton: button.primary,
  secondaryButton: button.secondary,
  dangerGhost: `
    inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-red-300 transition-colors
    hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50
  `,
  grid: 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]',
  panel: cx(surface.card, 'p-5 md:p-6'),
  panelTitle: text.cardTitle,
  fieldLabel: field.label,
  input: field.input,
  inlineAction: `inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#fa7517] transition-colors hover:text-[#ff8c3a] ${focusRing}`,
  editorFrame: 'max-h-[50vh] overflow-auto rounded-lg',
  counter: 'text-xs tabular-nums text-gray-400',
  frame: 'relative aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-black',
  metaRow: 'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400',
  thumbnailFrame: 'aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-black',
  errorText: field.error,
  errorNote: 'flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] p-2.5 text-xs text-red-200',
};

export const list = {
  panel: surface.card,
  table: {
    header: table.head,
    headerCell: table.th,
    row: cx('relative', table.row),
    cell: 'px-4 py-3.5 align-middle',
  },
  divider: surface.divider,
  title: `
    truncate rounded-sm text-left text-sm font-medium text-gray-100 transition-colors
    hover:text-[#fa7517] focus-visible:outline-none focus-visible:text-[#fa7517]
  `,
  preview: 'truncate text-xs text-gray-400',
  stat: 'text-sm tabular-nums text-gray-300',
  /** Row controls: faded until the row is hovered or focused; always there on touch screens. */
  revealed: `
    opacity-0 transition-opacity duration-150 motion-reduce:transition-none
    group-hover:opacity-100 group-focus-within:opacity-100
    [&:focus-within]:opacity-100
    [@media(pointer:coarse)]:opacity-100
  `,
  actionButton: button.icon,
  actionIcon: 'h-4 w-4',
  tooltip: popover.panel,
  dropdownMenu: {
    content: popover.menu,
    item: popover.item,
    dangerItem: `
      flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-300 outline-none transition-colors
      data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-200
    `,
  },
  emptyState: {
    wrapper: empty.wrapper,
    title: 'text-base font-semibold text-white',
    subtitle: 'mt-1 max-w-md text-sm text-gray-400',
  },
  loadMore: {
    wrapper: 'border-t border-gray-800/50 p-3 text-center',
    button: button.ghost,
  },
};

export const passStatusPill = {
  base: pill.base,
  draft: pill.neutral,
  live: pill.positive,
  paused: pill.attention,
  failed: pill.negative,
  publishing: pill.accent,
};

export const hairlineBar = meter;

/** Tier is metadata: one neutral pill, the tier as text. */
export const tierPill = 'inline-flex items-center rounded-full border border-gray-800 bg-black/40 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-gray-300';

/** Chart tokens, as the Analytics charts draw them. */
export const chart = {
  grid: '#222',
  axis: '#666',
  tick: { fill: '#8b8f98', fontSize: 11 },
  tooltip: 'rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-xs shadow-xl',
  secondary: '#9ca3af',
};
