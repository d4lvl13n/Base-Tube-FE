export const styles = {
  // Outer layout
  modal: 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 md:p-20',
  overlay: 'fixed inset-0 bg-black/90 backdrop-blur-sm',

  // Container for the modal panel - increased width
  container: 'relative w-full max-w-4xl mx-auto',

  // Main content box with enhanced styling
  content: `
    relative bg-gray-900 rounded-2xl border border-[#fa7517]/20
    backdrop-blur-sm overflow-hidden shadow-2xl
    transform transition-all duration-300
    shadow-[0_0_20px_rgba(250,117,23,0.2)]
  `,

  // Enhanced header
  header: 'relative p-6 border-b border-gray-800/30 bg-black/40',
  title: 'text-2xl font-bold text-white',

  // Close button with improved hover states
  closeButton: `
    absolute top-6 right-6 rounded-lg p-2 
    hover:bg-gray-800/50 transition-colors duration-300
    text-gray-400 hover:text-white
  `,

  // Form with better spacing
  form: 'p-8 space-y-8',

  // Input groups with enhanced styling
  inputGroup: 'space-y-3',
  label: 'block text-sm font-medium text-gray-300',
  input: `
    w-full rounded-lg px-4 py-3 bg-gray-800/50 
    border border-gray-700 text-sm text-white
    placeholder-gray-500 focus:border-[#fa7517] 
    focus:ring-2 focus:ring-[#fa7517]/50
    transition-all duration-300
  `,

  // Error message
  errorText: 'mt-2 text-sm text-red-500',

  // Enhanced image preview section - wider format
  imageWrapper: `
    w-full h-48 bg-gray-800/50 rounded-xl relative overflow-hidden
    border-2 border-dashed border-gray-700 hover:border-[#fa7517]
    transition-colors duration-300 cursor-pointer
    group
  `,
  imagePlaceholder: `
    flex flex-col items-center justify-center w-full h-full 
    text-gray-500 group-hover:text-gray-400 transition-colors
  `,
  fileInput: 'hidden',
  fileButton: `
    inline-flex items-center px-4 py-2.5 text-sm font-medium 
    rounded-lg bg-gray-800 hover:bg-gray-700 
    text-white cursor-pointer transition-colors duration-300
    border border-gray-700 hover:border-[#fa7517]
  `,

  // Actions container with gradient button
  actionsContainer: 'flex justify-end gap-4 pt-6 border-t border-gray-800/30',
  cancelButton: `
    px-6 py-2.5 text-sm font-medium rounded-xl
    bg-gray-800 hover:bg-gray-700 text-white
    transition-all duration-300 border border-gray-700
  `,
  saveButton: `
    px-6 py-2.5 text-sm font-medium rounded-xl
    bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] 
    text-black hover:from-[#ff8c3a] hover:to-[#fa7517]
    transition-all duration-300
    hover:shadow-[0_0_25px_rgba(250,117,23,0.5)]
  `,
} as const; 