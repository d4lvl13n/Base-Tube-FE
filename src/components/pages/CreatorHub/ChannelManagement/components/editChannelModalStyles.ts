export const styles = {
  // Outer layout
  modal: 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 md:p-20',
  overlay: 'fixed inset-0 bg-black/90 backdrop-blur-sm',

  // Container for the modal panel
  container: 'relative w-full max-w-2xl mx-auto',

  // Main content box
  content: `
    relative bg-gray-900/80 rounded-2xl border border-gray-800/40 
    backdrop-blur-sm overflow-hidden shadow-2xl
    transform transition-all duration-300
  `,

  // Header
  header: 'relative p-6 border-b border-gray-800/30 bg-black/20',
  title: 'text-xl font-semibold text-white',

  // Close button
  closeButton: `
    absolute top-6 right-6 rounded-lg p-2 
    hover:bg-gray-800 transition-colors duration-300
    text-gray-400 hover:text-white
  `,

  // Form
  form: 'p-6 space-y-8',

  // Generic input group
  inputGroup: 'space-y-2',
  label: 'block text-sm font-medium text-gray-300',
  input: `
    w-full rounded-lg px-4 py-3 bg-black/30 
    border border-gray-800 text-sm text-white
    placeholder-gray-500 focus:border-[#fa7517]/50 
    focus:ring-1 focus:ring-[#fa7517]/50
    transition-all duration-300
  `,

  // Error message
  errorText: 'mt-2 text-sm text-red-500',

  // Image preview section
  imageWrapper: `
    w-24 h-24 bg-black/30 rounded-xl relative overflow-hidden
    border-2 border-dashed border-gray-700 hover:border-[#fa7517]/50
    transition-colors duration-300
  `,
  imagePlaceholder: 'flex items-center justify-center w-full h-full text-gray-500',
  fileInput: 'hidden',
  fileButton: `
    inline-flex items-center px-4 py-2.5 text-sm font-medium 
    rounded-lg bg-gray-800 hover:bg-gray-700 
    text-white cursor-pointer transition-colors duration-300
    border border-gray-700 hover:border-[#fa7517]/50
  `,

  // Actions
  actionsContainer: 'flex justify-end gap-3 pt-6 border-t border-gray-800/30',
  cancelButton: `
    px-4 py-2.5 text-sm font-medium rounded-lg 
    bg-gray-800 hover:bg-gray-700 text-white
    transition-all duration-300 border border-gray-700
  `,
  saveButton: `
    px-4 py-2.5 text-sm font-medium rounded-lg
    bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] 
    text-black hover:from-[#ff8c3a] hover:to-[#fa7517]
    transition-all duration-300
  `,
} as const; 