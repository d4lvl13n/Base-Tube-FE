export const styles = {
  container: `
    bg-black/40 rounded-xl overflow-hidden border border-gray-800/50 
    backdrop-blur-sm relative mx-4
    before:absolute before:inset-0 
    before:bg-gradient-to-br before:from-[#fa7517]/5 before:to-transparent 
    before:opacity-0 before:transition-opacity before:rounded-xl 
    hover:before:opacity-100
  `,
  table: {
    wrapper: "overflow-x-auto -mx-4 md:mx-0 scrollbar-thin scrollbar-thumb-gray-800/50 scrollbar-track-transparent",
    header: "bg-black/40 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-800/50",
    headerCell: `
      px-4 py-3 text-left text-xs font-medium text-gray-400
      uppercase tracking-wider transition-colors whitespace-nowrap
      select-none
    `,
    row: `
      transition-colors duration-200 border-b border-gray-800/30
      hover:bg-gray-800/20
    `,
    cell: "px-3 py-3 md:px-6 md:py-4 whitespace-nowrap",
    /**
     * The Studio-row cell.
     *
     * Below `md` the row is a card and its own padding does the spacing, so a
     * cell adds none; from `md` up it is a table cell again and needs it back.
     */
    cellNext: "px-0 py-0 md:px-4 md:py-4",
    mobileInfo: `
      flex flex-col gap-1 md:hidden mt-2 
      text-xs text-gray-400 border-t 
      border-gray-800/30 pt-2
    `,
    mobileStats: `
      grid grid-cols-2 gap-2
      text-xs text-gray-400
    `,
    mobileStat: `
      flex items-center gap-1.5
      bg-black/30 rounded-lg p-2
      border border-gray-800/50
    `,
  },
  checkbox: `
    h-4 w-4 rounded border-gray-700 text-[#fa7517]
    focus:ring-[#fa7517] focus:ring-offset-0
    focus:ring-offset-transparent transition-colors duration-200
    bg-black/30 cursor-pointer
  `,
  thumbnail: {
    wrapper: `
      flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden 
      bg-black/50 border border-gray-800/50
      transition-all duration-200 hover:scale-105
      hover:border-[#fa7517]/30 hover:shadow-lg hover:shadow-[#fa7517]/5
    `,
    image: "h-full w-full object-cover",
  },
  videoInfo: {
    title: "text-sm font-medium text-white hover:text-[#fa7517] transition-colors duration-200 line-clamp-1 md:line-clamp-none",
    description: "text-sm text-gray-400 line-clamp-1 md:line-clamp-2 mt-1",
  },
  status: {
    public: `
      inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium 
      bg-[#fa7517]/10 text-[#fa7517] border border-[#fa7517]/20
      backdrop-blur-sm
    `,
    private: `
      inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium 
      bg-gray-800/50 text-gray-400 border border-gray-800/50
      backdrop-blur-sm
    `,
  },
  processing: {
    container: `
      flex flex-col w-full max-w-xs bg-black/30 rounded-xl p-3 mt-2 
      border border-gray-800/50 backdrop-blur-sm
    `,
    header: "flex justify-between text-xs text-gray-400",
    progressBar: {
      container: "h-1.5 bg-black/30 rounded-full mt-2",
      progress: "h-full bg-[#fa7517] rounded-full transition-all duration-300",
    },
    quality: "text-xs text-gray-500 mt-1",
  },
  error: {
    container: `
      text-red-400 text-sm flex items-center gap-2 
      bg-red-500/10 rounded-xl p-3 mt-2 
      border border-red-500/20 backdrop-blur-sm
    `,
    retryButton: `
      ml-2 text-xs bg-red-500/20 hover:bg-red-500/30 
      px-3 py-1 rounded-lg transition-colors
    `,
  },
  tooltip: `
    z-50 px-3 py-2 text-sm bg-gray-900 rounded-lg shadow-xl 
    border border-gray-800/50 backdrop-blur-sm
  `,
  loadMore: {
    wrapper: "flex justify-center py-6",
    button: `
      px-6 py-2.5 bg-black/30 text-white rounded-xl
      hover:bg-gray-800/50 transition-all duration-200
      border border-gray-800/50 hover:border-[#fa7517]/30
      flex items-center gap-2 backdrop-blur-sm
      hover:shadow-lg hover:shadow-[#fa7517]/5
    `,
  },
  emptyState: {
    wrapper: `
      flex flex-col items-center justify-center py-16 px-6 text-center
      text-gray-400 bg-black/20
    `,
    title: "text-lg font-medium mb-2",
    subtitle: "text-sm opacity-75",
  },
  actionButton: `
    p-2 rounded-lg transition-colors duration-200 text-gray-400
    hover:bg-gray-800/60 hover:text-white focus:outline-none
    focus-visible:ring-1 focus-visible:ring-[#fa7517]/60
    inline-flex items-center justify-center
    min-w-[36px] min-h-[36px]
  `,
  actionIcon: "w-4 h-4",
  cancelButton: `
    px-4 py-2 rounded-lg bg-gray-800/50 text-white 
    hover:bg-gray-700/50 transition-colors
  `,
  deleteButton: `
    px-4 py-2 rounded-lg bg-red-500/20 text-red-500
    hover:bg-red-500/30 transition-colors
  `,
  dropdownMenu: {
    content: `
      min-w-[160px] bg-black/90 rounded-xl p-1.5 
      shadow-lg border border-gray-800/50 backdrop-blur-sm
      animate-in slide-in-from-top-2 duration-200
    `,
    item: `
      text-white px-3 py-2 text-sm hover:bg-gray-800/50 
      rounded-lg cursor-pointer transition-colors duration-200
      flex items-center gap-2
    `,
    separator: "h-px bg-gray-800/50 my-1",
    dangerItem: `
      text-red-400 px-3 py-2 text-sm hover:bg-gray-800/50 
      rounded-lg cursor-pointer transition-colors duration-200
      flex items-center gap-2
    `,
  }
};