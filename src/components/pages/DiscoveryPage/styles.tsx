// src/components/pages/DiscoveryPage/styles.tsx

import React from 'react';

interface CategoryNavProps<T extends string> {
  categories: T[];
  activeCategory: T;
  onChange: (category: T) => void;
}

export const CategoryNav = <T extends string>({ 
  categories, 
  activeCategory, 
  onChange 
}: CategoryNavProps<T>) => {
  return (
    <div className="flex space-x-2 mb-4">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full transition-all duration-300 ease-in-out ${
            activeCategory === cat
              ? 'bg-gradient-to-r from-[#fa7517] to-[#ffa041] text-black shadow-lg'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export const VideoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 
                    gap-4 sm:gap-6 mt-8 mx-auto max-w-[2400px]">
      {children}
    </div>
  );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-yellow-600 text-white p-4 rounded-md my-4">
    <p>{message}</p>
  </div>
);

export const Loader: React.FC = () => (
  <div className="flex justify-center items-center mt-8">
    <div className="w-16 h-16 border-4 border-[#fa7517] border-t-transparent rounded-full animate-spin"></div>
  </div>
);