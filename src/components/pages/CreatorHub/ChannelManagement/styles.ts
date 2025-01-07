export const styles = {
  // Layout
  container: 'p-8 max-w-7xl mx-auto',
  header: 'flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gray-900/30 rounded-2xl p-6 border border-gray-800/50 backdrop-blur-sm',
  headerInfo: 'flex items-center gap-6',
  actionButtons: 'flex flex-wrap gap-3',

  // Channel Image
  channelImage: 'w-24 h-24 rounded-xl object-cover border-2 border-gray-800/50 shadow-lg hover:border-[#fa7517]/50 transition-colors duration-300',
  
  // Typography
  title: 'text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent',
  handle: 'text-gray-400 font-medium',
  sectionTitle: 'text-xl font-semibold text-white mb-4',
  label: 'text-sm font-medium text-gray-400',
  
  // Cards
  cardGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  card: `
    relative bg-gray-900/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm
    transition-all duration-300 hover:border-gray-700/50
    before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#fa7517]/5 before:to-transparent 
    before:opacity-0 before:transition-opacity before:rounded-xl hover:before:opacity-100
  `,
  
  // Buttons
  editButton: `
    px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl 
    flex items-center gap-2 transition-all duration-300 font-medium
    border border-gray-700/50 hover:border-[#fa7517]/50 hover:text-[#fa7517]
  `,
  deleteButton: `
    px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 
    rounded-xl flex items-center gap-2 transition-all duration-300 font-medium
    border border-red-500/30 hover:border-red-500/50
  `,
  
  // Social Links
  socialLinksContainer: 'space-y-4',
  socialLink: {
    base: `
      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
      border border-gray-800/50 hover:border-gray-700
      font-medium
    `,
    facebook: 'text-blue-500 bg-blue-500/5 hover:bg-blue-500/10',
    instagram: 'text-pink-500 bg-pink-500/5 hover:bg-pink-500/10',
    twitter: 'text-blue-400 bg-blue-400/5 hover:bg-blue-400/10',
  },

  // Loading States
  loadingPulse: 'space-y-4',
  loadingBlock: 'bg-gray-800/50 rounded-xl animate-pulse',
  
  // Error States
  errorContainer: 'bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-500',
  
  // Empty States
  emptyContainer: `
    bg-gray-900/30 rounded-xl p-8 text-center border border-gray-800/50 
    backdrop-blur-sm space-y-3
  `,
  emptyIcon: 'w-16 h-16 mx-auto text-gray-600 mb-4',
  emptyTitle: 'text-xl font-semibold text-white',
  emptyText: 'text-gray-400 max-w-md mx-auto',
} as const; 