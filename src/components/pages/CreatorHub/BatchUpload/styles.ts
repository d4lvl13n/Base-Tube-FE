export const styles = {
  container: 'p-8 max-w-7xl mx-auto space-y-8',
  
  // Header styles
  header: `
    bg-black/50 rounded-2xl p-6 border border-gray-800/50 
    backdrop-blur-sm relative overflow-hidden
  `,
  title: 'text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400',
  subtitle: 'text-gray-400 mt-2',

  // Upload zone styles
  uploadZone: `
    relative border-2 border-dashed border-gray-800/50 
    rounded-2xl p-12 text-center transition-all duration-300
    hover:border-[#fa7517]/50 group
    focus-within:border-[#fa7517]/50
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:border-gray-800/50
  `,
  uploadZoneActive: 'border-[#fa7517] bg-[#fa7517]/5',
  uploadIcon: 'w-16 h-16 mx-auto text-gray-600 group-hover:text-[#fa7517] transition-colors',
  uploadText: 'mt-4 text-gray-400 group-hover:text-gray-300',
  
  // File list styles
  fileList: 'space-y-4 mt-8',
  fileCard: `
    bg-black/50 rounded-xl p-4 border border-gray-800/50 
    backdrop-blur-sm relative overflow-hidden
    transition-all duration-300
  `,
  
  // Progress styles
  progressTrack: 'mt-4 h-2 rounded-full bg-gray-800/50 overflow-hidden',
  progressBar: 'relative w-full h-2 bg-gray-200 rounded overflow-hidden mt-2',
  progressFill: 'absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300',
  progressText: 'absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white font-medium',

  // Status indicators
  statusIcon: {
    completed: 'w-5 h-5 text-green-500',
    error: 'w-5 h-5 text-red-500',
    pending: 'w-5 h-5 text-gray-400',
    uploading: 'w-5 h-5 text-[#fa7517]'
  },

  // File actions
  fileActions: 'flex items-center space-x-2',
  removeButton: `
    p-1 hover:bg-gray-800 rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50
  `,

  // Button styles
  button: {
    primary: `
      px-6 py-3 rounded-xl font-medium
      bg-gradient-to-r from-[#fa7517] to-orange-400
      text-black hover:from-orange-400 hover:to-[#fa7517]
      transition-all duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50
    `,
    secondary: `
      px-6 py-3 rounded-xl font-medium
      bg-gray-800 hover:bg-gray-700
      text-white transition-colors duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-gray-600
    `
  },

  // Error message styles
  errorMessage: `
    mt-4 p-4 bg-red-500/10 border border-red-500/20 
    rounded-xl text-red-400
  `,

  // File error message
  fileError: 'mt-2 text-sm text-red-400',

  // File info
  fileInfo: 'flex-1',
  fileName: 'font-medium text-white truncate',
  fileSize: 'text-sm text-gray-400',

  // Loading state
  loading: 'opacity-50 pointer-events-none',

  // Accessibility
  srOnly: 'sr-only',

  // Add this to the styles object
  retryButton: `
    p-1 hover:bg-gray-800 rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-red-500/50
  `,

  // Add with other upload-related styles
  uploadLabel: `
    flex flex-col items-center w-full h-full cursor-pointer
    group-hover:text-[#fa7517] transition-colors
  `
} as const;