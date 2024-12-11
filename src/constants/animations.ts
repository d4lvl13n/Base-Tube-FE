// src/constants/animations.ts
export const ANIMATIONS = {
  pageTitle: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  sortOptions: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: 0.2 }
  },
  card: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.02 },
    transition: { duration: 0.2 }
  }
};

export const TAILWIND_CLASSES = {
  sortButton: (isActive: boolean) => `
    px-4 py-2 rounded-full transition-all duration-300 ease-in-out
    ${isActive 
      ? 'bg-gradient-to-r from-[#fa7517] to-[#ffa041] text-black shadow-lg' 
      : 'bg-gray-800 hover:bg-gray-700'}
  `,
  channelCard: `
    group bg-gray-900/30 rounded-xl border border-gray-800/30 
    backdrop-blur-sm overflow-hidden relative
  `
};