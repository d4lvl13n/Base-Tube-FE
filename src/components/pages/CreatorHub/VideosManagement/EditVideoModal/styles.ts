/**
 * The edit page, in the same language as Content Studio and the video list.
 *
 * One `#0f0f0f` panel per idea, hairline `gray-800/60` borders, 12–14 px type,
 * `text-gray-500` for anything you only glance at, and orange reserved for the
 * one action that commits. Nothing here is a hero: the page opens on the
 * fields, not on a title card.
 */
export const styles = {
  page: 'pb-12 text-white',

  /** A 56 px bar, not a block: everything in it sits on one line. */
  header: `
    sticky top-24 z-30 -mx-4 mb-5 flex h-14 items-center gap-3 border-b border-gray-800/60
    bg-[#0f0f0f]/95 px-4 backdrop-blur-md md:-mx-6 md:px-6
  `,
  ghostButton: `
    inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm text-gray-400
    transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed
    disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[#fa7517]/40
  `,
  primaryButton: `
    inline-flex h-8 min-w-[80px] shrink-0 items-center justify-center gap-1.5 rounded-md
    bg-[#fa7517] px-3 text-sm font-medium text-black transition-colors hover:bg-[#ff8c3a]
    disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-gray-600
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60
  `,
  dangerGhost: `
    inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-red-400/90
    transition-colors hover:bg-red-500/10 hover:text-red-300
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
  `,

  /** Details carries the work; Preview is the reference beside it. */
  grid: 'grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]',
  panel: 'rounded-xl border border-gray-800/60 bg-[#0f0f0f] p-4 md:p-5',
  panelTitle: 'text-sm font-medium text-gray-200',

  fieldLabel: 'block text-xs font-medium uppercase tracking-wider text-gray-500',
  input: `
    h-9 w-full rounded-md border border-gray-800/60 bg-white/5 px-3 text-sm text-gray-100
    transition-colors placeholder:text-gray-600 hover:border-gray-700
    focus-visible:border-[#fa7517]/40 focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[#fa7517]/40
  `,
  inlineAction: `
    inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#fa7517]
    transition-colors hover:text-[#ff8c3a] focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
  `,
  /** The editor is a window onto the description, not the whole viewport. */
  editorFrame: 'overflow-auto rounded-md max-h-[50vh]',
  counter: 'text-xs tabular-nums text-gray-600',

  frame: 'relative aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-black',
  metaRow: 'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500',

  thumbnailFrame: 'aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-black',
  secondaryButton: `
    inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-gray-800/60
    bg-white/5 px-3 text-sm text-gray-300 transition-colors hover:border-gray-700
    hover:text-white focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[#fa7517]/40
  `,

  errorText: 'text-xs text-red-400',
  errorNote: `
    flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-2.5
    text-xs text-red-300
  `,
};

/** The status pill's colour, by what the status actually means. */
export const statusPill = {
  base: 'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
  processed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  processing: 'border-[#fa7517]/25 bg-[#fa7517]/10 text-[#fa7517]',
  failed: 'border-red-500/25 bg-red-500/10 text-red-400',
};
