export const connectWalletButtonStyles = `
  relative group overflow-hidden bg-black/70 backdrop-blur-sm
  border border-white/5 hover:border-[#fa7517]/20 text-white/70 hover:text-white
  transition-all duration-300
  before:absolute before:inset-0
  before:bg-gradient-to-r before:from-[#fa7517] before:to-orange-400
  before:opacity-0 before:hover:opacity-10 before:transition-opacity before:duration-300
  md:hidden rounded-full w-10 h-10 flex items-center justify-center
  md:flex md:items-center md:gap-2 md:rounded-lg md:px-4 md:h-10
  md:bg-gradient-to-r md:from-black/70 md:to-black/60
  md:hover:from-[#fa7517]/20 md:hover:to-transparent
  shadow-[0_0_30px_-15px] shadow-black
  hover:shadow-[0_0_30px_-10px] hover:shadow-[#fa7517]/20
`;
