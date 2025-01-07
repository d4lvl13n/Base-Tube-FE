export const styles = {
  modal: `fixed inset-0 z-50 flex items-center justify-center overflow-y-auto`,
  overlay: `absolute inset-0 bg-black/80 backdrop-blur-sm`,
  container: `relative w-full max-w-4xl mx-auto p-6`,
  content: `bg-black/50 rounded-xl border border-gray-800/30 backdrop-blur-sm overflow-hidden`,
  header: `flex items-center justify-between p-6 border-b border-gray-800/30`,
  title: `text-xl font-bold text-white`,
  form: `p-6 space-y-6`,
  
  // Form elements
  inputGroup: `space-y-2`,
  label: `block text-sm font-medium text-gray-400`,
  input: `w-full px-4 py-2 bg-gray-900/50 border border-gray-800/30 rounded-lg 
          focus:outline-none focus:border-[#fa7517] text-white`,
  
  // Thumbnail section
  thumbnailContainer: `aspect-video bg-gray-900/50 rounded-lg cursor-pointer 
                      hover:bg-gray-800/50 transition-colors`,
  thumbnailPreview: `w-full h-full object-cover rounded-lg`,
  
  // Buttons
  buttonGroup: `flex justify-end gap-4 p-6 border-t border-gray-800/30`,
  cancelButton: `px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700`,
  saveButton: `px-4 py-2 rounded-lg bg-[#fa7517] text-black hover:bg-[#fa9517]`,
}; 