import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full
        bg-gradient-to-r from-[#fa7517] to-[#ff9a5a]
        text-white font-bold
        transition-all duration-300
        hover:shadow-lg hover:shadow-[#fa7517]/50
        active:scale-95
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;