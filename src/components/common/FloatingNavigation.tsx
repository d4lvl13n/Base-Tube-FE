import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface NavigationOption<T extends string> {
  key: T;
  icon: LucideIcon;
  label: string;
  description?: string;
}

interface FloatingNavigationProps<T extends string> {
  options: NavigationOption<T>[];
  activeOption: T;
  setActiveOption: (option: T) => void;
}

const FloatingNavigation = <T extends string>({
  options,
  activeOption,
  setActiveOption,
}: FloatingNavigationProps<T>) => {
  const [isCompact, setIsCompact] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsVisible(
        currentScrollY < lastScrollY ||
        currentScrollY < 100 ||
        currentScrollY > 300
      );

      setLastScrollY(currentScrollY);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.nav
          aria-label="Discovery feed filters"
          className={`pointer-events-none fixed z-[60] ${
            isCompact
              ? 'bottom-5 left-0 right-0 flex justify-center px-2'
              : 'inset-y-0 right-8 flex items-center'
          }`}
          initial={{ opacity: 0, x: isCompact ? 0 : 70, y: isCompact ? 70 : 0, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: isCompact ? 0 : 70, y: isCompact ? 70 : 0, scale: 0.96 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            duration: 0.3,
          }}
        >
          <div
            className={`pointer-events-auto relative flex max-w-full rounded-full border border-[rgba(214,235,253,0.12)] bg-black/[0.72] shadow-[0_0_0_1px_rgba(176,199,217,0.08),0_20px_54px_rgba(0,0,0,0.48)] backdrop-blur-xl ${
              isCompact
                ? 'items-center gap-2 overflow-x-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                : 'flex-col items-center gap-3 px-3 py-4'
            }`}
          >
            <div className="pointer-events-none absolute inset-3 rounded-full border border-[#fa7517]/10" />
            <div
              className={`pointer-events-none absolute ${
                isCompact
                  ? 'inset-x-7 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r'
                  : 'inset-y-7 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b'
              } from-transparent via-[#fa7517]/20 to-transparent`}
            />

            {options.map(({ key, icon: Icon, label, description }) => {
              const active = activeOption === key;

              return (
                <motion.button
                  key={key}
                  type="button"
                  aria-label={description || label}
                  onClick={() => setActiveOption(key)}
                  className={`group relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? 'border-[#fa7517]/80 bg-[#fa7517] text-black shadow-[0_0_30px_rgba(250,117,23,0.34)]'
                      : 'border-[rgba(214,235,253,0.16)] bg-black/[0.82] text-white shadow-[0_0_0_1px_rgba(176,199,217,0.08)] hover:border-[#fa7517]/40 hover:bg-white/[0.08]'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[#fa7517]/0 transition-colors group-hover:bg-[#fa7517]/10" />

                  {active && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(250,117,23,0.18),rgba(250,117,23,0.78),rgba(255,255,255,0.14),rgba(250,117,23,0.18))]" />
                      <span className="absolute inset-[4px] rounded-full bg-[#fa7517]" />
                    </>
                  )}

                  <Icon className={`relative h-[22px] w-[22px] ${active ? 'text-black' : 'text-white'}`} />

                  <span
                    className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-white/10 bg-black/95 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/[0.78] opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 ${
                      isCompact
                        ? 'bottom-full left-1/2 mb-3 -translate-x-1/2 group-hover:-translate-y-1'
                        : 'right-full top-1/2 mr-3 -translate-y-1/2 group-hover:-translate-x-1'
                    }`}
                  >
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default FloatingNavigation;
