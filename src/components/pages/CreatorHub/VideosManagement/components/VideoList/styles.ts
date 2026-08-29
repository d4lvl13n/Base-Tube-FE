/**
 * The Videos Management surface.
 *
 * These are the Content Studio tokens — one bordered panel, hairline dividers,
 * `text-gray-100` for what you read and `text-gray-500` for what you glance
 * at, orange only where something is on. Nothing here paints a browser default
 * (no native focus ring, no system checkbox, no OS select list): a control the
 * operating system draws is a control we cannot make match the rest of the app.
 */
export const styles = {
  /** The single panel the whole list lives in. */
  panel: 'overflow-hidden rounded-xl border border-gray-800/60 bg-[#0f0f0f]',

  table: {
    header: 'border-b border-gray-800/60',
    headerCell: `
      px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider
      text-gray-500 whitespace-nowrap select-none
    `,
    row: 'group relative transition-colors duration-150 hover:bg-white/[0.02]',
    cell: 'px-4 py-3 align-middle',
  },

  /** Hairlines between rows, in both layouts. */
  divider: 'divide-y divide-gray-800/60',

  title: `
    truncate text-left text-sm text-gray-100 transition-colors
    hover:text-[#fa7517] focus-visible:outline-none focus-visible:text-[#fa7517]
  `,
  preview: 'truncate text-xs text-gray-500',
  stat: 'text-xs tabular-nums text-gray-400',

  /**
   * Controls stay out of the way until you go looking for them, but they never
   * leave the tab order — and on a touch screen, where there is no hover to go
   * looking with, they are simply always there.
   */
  revealed: `
    opacity-0 transition-opacity duration-150
    group-hover:opacity-100 group-focus-within:opacity-100
    [&:focus-within]:opacity-100
    [@media(pointer:coarse)]:opacity-100
  `,

  actionButton: `
    inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500
    transition-colors hover:bg-white/5 hover:text-white
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
    disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent
    disabled:hover:text-gray-500
  `,
  actionIcon: 'h-4 w-4',

  tooltip: `
    z-50 rounded-md border border-gray-800/60 bg-[#0f0f0f] px-2.5 py-1.5
    text-xs text-gray-200 shadow-xl
  `,

  dropdownMenu: {
    content: `
      z-50 min-w-[11rem] overflow-hidden rounded-lg border border-gray-800/60
      bg-[#0f0f0f] p-1 shadow-2xl
    `,
    item: `
      flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm
      text-gray-300 outline-none transition-colors
      data-[highlighted]:bg-white/5 data-[highlighted]:text-white
    `,
    dangerItem: `
      flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm
      text-red-400 outline-none transition-colors
      data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300
    `,
  },

  loadMore: {
    wrapper: 'border-t border-gray-800/60 p-3 text-center',
    button: `
      inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-400
      transition-colors hover:bg-white/5 hover:text-white
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
      disabled:cursor-not-allowed disabled:opacity-50
    `,
  },

  emptyState: {
    wrapper: 'flex flex-col items-center justify-center px-6 py-16 text-center',
    title: 'text-sm font-medium text-gray-200',
    subtitle: 'mt-1 text-sm text-gray-500',
  },
};
