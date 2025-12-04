// src/components/pages/CTREngine/styles/cardTokens.ts
// Design tokens for consistent card styling across CTR Engine

/**
 * Card style variants for the CTR Engine
 * - base: Standard card without emphasis
 * - elevated: Cards with orange glow effect for emphasis/importance
 * - interactive: Cards that respond to hover/click
 */
export const cardStyles = {
  /** Standard card - dark background with subtle border */
  base: 'bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm',
  
  /** Elevated card - with orange glow shadow for visual emphasis */
  elevated: 'bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm shadow-[0_0_20px_5px_rgba(250,117,23,0.1),0_0_40px_10px_rgba(250,117,23,0.05),inset_0_0_60px_15px_rgba(250,117,23,0.03)]',
  
  /** Interactive card - hover state with border transition */
  interactive: 'bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm hover:border-[#fa7517]/30 transition-all cursor-pointer',
  
  /** Interactive elevated card - both glow and hover */
  interactiveElevated: 'bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm hover:border-[#fa7517]/30 transition-all cursor-pointer shadow-[0_0_20px_5px_rgba(250,117,23,0.1),0_0_40px_10px_rgba(250,117,23,0.05),inset_0_0_60px_15px_rgba(250,117,23,0.03)]',
};

/**
 * The CSS shadow value for the elevated glow effect
 * Can be used in style props when dynamic width/padding is needed
 */
export const elevatedShadow = `
  0 0 20px 5px rgba(250, 117, 23, 0.1),
  0 0 40px 10px rgba(250, 117, 23, 0.05),
  inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
`;

/**
 * Card padding variants
 */
export const cardPadding = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * Card border radius variants
 */
export const cardRadius = {
  default: 'rounded-xl',
  lg: 'rounded-2xl',
};

/**
 * Helper to combine card styles
 */
export function combineCardStyles(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

export default cardStyles;

