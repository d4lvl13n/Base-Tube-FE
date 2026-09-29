import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/** A thin orange line at the very top that fills as the page is read. */
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-[#fa7517] via-[#ff9a3c] to-[#ffd2a6]"
    />
  );
};

export default ScrollProgress;
