export const styles = {
  workspace: 'pb-10 space-y-6 text-white',
  topBar: `
    sticky top-24 z-20 flex flex-col gap-4 rounded-lg border border-gray-800/60
    bg-black/80 p-4 backdrop-blur-xl shadow-2xl shadow-black/30
    md:flex-row md:items-center md:justify-between
  `,
  backButton: `
    inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-800/70
    bg-gray-950/80 px-3 text-sm font-medium text-gray-300 transition-colors
    hover:border-[#fa7517]/50 hover:text-white
  `,
  primaryButton: `
    inline-flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-lg
    bg-[#fa7517] px-4 text-sm font-semibold text-black transition-colors
    hover:bg-[#ff8c3a] disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500
  `,
  secondaryButton: `
    inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-800/70
    bg-gray-950/70 px-4 text-sm font-medium text-gray-300 transition-colors
    hover:border-gray-700 hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50
  `,
  statusPill: `
    inline-flex shrink-0 items-center rounded-full border border-[#fa7517]/30
    bg-[#fa7517]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#fa7517]
  `,
  warningPill: `
    inline-flex items-center rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10
    px-2.5 py-1 text-xs font-medium text-[#fa7517]
  `,
  grid: 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.25fr)]',
  panel: `
    rounded-lg border border-gray-800/60 bg-black/45 p-5 backdrop-blur-sm
    shadow-xl shadow-black/20 md:p-6
  `,
  panelHeader: 'mb-5 flex items-start justify-between gap-4',
  eyebrow: 'text-xs font-semibold uppercase tracking-wide text-[#fa7517]',
  panelTitle: 'mt-1 text-lg font-semibold text-white',
  toolButton: `
    inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#fa7517]/30
    bg-[#fa7517]/10 px-3 text-sm font-semibold text-[#fa7517] transition-colors
    hover:bg-[#fa7517]/20
  `,
  videoPreview: `
    relative aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-black
  `,
  previewFallback: `
    flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-950
  `,
  previewOverlay: `
    absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm
  `,
  thumbnailFrame: `
    mb-4 aspect-video overflow-hidden rounded-lg border border-gray-800/60 bg-gray-950
  `,
  thumbnailEmpty: 'flex h-full items-center justify-center bg-gray-950',
  dropZone: `
    mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-700
    bg-gray-950/70 p-4 transition-colors hover:border-[#fa7517]/50 hover:bg-[#fa7517]/5
  `,
  statsGrid: 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2',
  statTile: `
    flex min-h-[88px] flex-col justify-between rounded-lg border border-gray-800/60
    bg-black/45 p-4
    [&_span]:text-xl [&_span]:font-semibold [&_span]:text-white
    [&_small]:text-xs [&_small]:uppercase [&_small]:tracking-wide [&_small]:text-gray-500
  `,
  inputGroup: 'space-y-2',
  label: 'block text-sm font-medium text-gray-300',
  input: `
    h-12 w-full rounded-lg border border-gray-800/70 bg-gray-950/80 px-4 text-white
    outline-none transition-colors placeholder:text-gray-600 focus:border-[#fa7517]/70
  `,
  tagInput: `
    flex h-12 items-center gap-3 rounded-lg border border-gray-800/70
    bg-gray-950/80 px-4 focus-within:border-[#fa7517]/70
  `,
  inlineAction: `
    inline-flex items-center gap-2 text-sm font-medium text-[#fa7517] transition-colors
    hover:text-[#ff8c3a]
  `,
  visibilityOption: `
    flex min-h-[84px] items-start gap-3 rounded-lg border border-gray-800/70
    bg-gray-950/60 p-4 text-left transition-colors hover:border-gray-700
    [&_strong]:block [&_strong]:text-sm [&_strong]:text-white
    [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-gray-500
  `,
  visibilityOptionActive: 'border-[#fa7517]/60 bg-[#fa7517]/10',
  metaStrip: `
    grid gap-3 border-t border-gray-800/60 pt-5 text-sm text-gray-400 md:grid-cols-2
    [&_div]:flex [&_div]:items-center [&_div]:gap-2
  `,
  warningBox: `
    flex items-start gap-3 rounded-lg border border-[#fa7517]/25 bg-[#fa7517]/10
    p-4 text-sm text-gray-200
  `,
  errorNote: `
    mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10
    p-3 text-sm text-red-300
  `,
  errorText: 'text-sm text-red-400',
};
