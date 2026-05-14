import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { NavigationItem } from './navigationItems';

type TooltipPlacement = 'right' | 'top';

interface CommandOrbNavItemProps {
  item: NavigationItem;
  active: boolean;
  disabled?: boolean;
  tooltipPlacement?: TooltipPlacement;
}

const tooltipPlacementClasses: Record<TooltipPlacement, string> = {
  right: 'left-full top-1/2 ml-3 -translate-y-1/2 group-hover:translate-x-1',
  top: 'bottom-full left-1/2 mb-3 -translate-x-1/2 group-hover:-translate-y-1',
};

const CommandOrbNavItem: React.FC<CommandOrbNavItemProps> = ({
  item,
  active,
  disabled = false,
  tooltipPlacement = 'right',
}) => {
  const Icon = item.Icon;

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
    >
      <Link
        to={item.path}
        aria-label={item.description}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
        className="block"
      >
        <motion.span
          className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-colors ${
            active
              ? 'border-[#fa7517]/80 bg-[#fa7517] text-black shadow-[0_0_30px_rgba(250,117,23,0.34)]'
              : disabled
                ? 'border-white/[0.08] bg-black/[0.45] text-white/[0.28] shadow-[0_0_0_1px_rgba(176,199,217,0.04)]'
                : 'border-[rgba(214,235,253,0.16)] bg-black/[0.82] text-white shadow-[0_0_0_1px_rgba(176,199,217,0.08)] hover:border-[#fa7517]/40 hover:bg-white/[0.08]'
          }`}
          whileHover={disabled ? undefined : { scale: 1.08 }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[#fa7517]/0 transition-colors group-hover:bg-[#fa7517]/10" />

          {active && (
            <>
              <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(250,117,23,0.18),rgba(250,117,23,0.78),rgba(255,255,255,0.14),rgba(250,117,23,0.18))]" />
              <span className="absolute inset-[4px] rounded-full bg-[#fa7517]" />
            </>
          )}

          <Icon
            className={`relative h-[22px] w-[22px] ${
              active ? 'text-black' : disabled ? 'text-white/[0.28]' : 'text-white'
            }`}
          />
        </motion.span>
      </Link>

      <span
        className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-white/10 bg-black/95 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/[0.78] opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 ${tooltipPlacementClasses[tooltipPlacement]}`}
      >
        {item.label}
      </span>
    </motion.div>
  );
};

export default CommandOrbNavItem;
