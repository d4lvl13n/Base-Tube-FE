import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'default' | 'outline' | 'ghost' | 'sign-in' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default',
  size = 'md',
  iconOnly = false,
  className = '',
  children,
  ...props 
}) => {
  const baseStyles = `
    rounded-lg font-medium 
    transition-all duration-300 
    flex items-center justify-center
    backdrop-blur-sm
  `;
  
  const variantStyles = {
    default: 'bg-[#fa7517] hover:bg-[#fa7517]/90 text-white',
    outline: 'border border-[#fa7517] text-[#fa7517] hover:bg-[#fa7517]/10',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800/50',
    'sign-in': `
      relative overflow-hidden
      bg-gradient-to-r from-gray-900 to-black/80
      border border-[#fa7517]/20
      hover:border-[#fa7517]/40
      text-white/90
      hover:text-white
      transition-all duration-300

      /* Glow effect */
      before:absolute before:inset-0 
      before:bg-[#fa7517]/5
      before:opacity-0 before:hover:opacity-100
      before:transition-opacity before:duration-300

      /* Shadow/Halo effect */
      shadow-[0_0_30px_-15px] shadow-black
      hover:shadow-[0_0_30px_-10px] hover:shadow-[#fa7517]/30

      /* Additional effects */
      after:absolute after:inset-0
      after:bg-gradient-to-r after:from-[#fa7517]/10 after:to-transparent
      after:opacity-0 after:hover:opacity-100
      after:transition-all after:duration-500
      backdrop-blur-sm
    `,
    'icon': `
      bg-black/70 
      border border-white/5
      hover:border-[#fa7517]/20
      text-white/70
      hover:text-[#fa7517]
      hover:bg-[#fa7517]/10
      shadow-[0_0_30px_-15px] shadow-black
      hover:shadow-[0_0_30px_-10px] hover:shadow-[#fa7517]/20
      rounded-full
      backdrop-blur-sm
      p-2
    `
  };

  const sizeStyles = {
    sm: iconOnly ? 'h-9 w-9' : 'h-9',
    md: iconOnly ? 'h-10 w-10' : 'h-10',
    lg: iconOnly ? 'h-11 w-11' : 'h-11'
  };

  const contentStyles = {
    sm: iconOnly ? '' : 'px-3 text-sm',
    md: iconOnly ? '' : 'px-4 text-base',
    lg: iconOnly ? '' : 'px-6 text-lg'
  };

  return (
    <motion.button
      whileHover={{ 
        scale: variant === 'ghost' ? 1 : 1.05,
        translateY: -1
      }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${!iconOnly && contentStyles[size]}
        ${className}
      `}
      {...props}
    >
      {variant === 'sign-in' && !iconOnly && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default Button;