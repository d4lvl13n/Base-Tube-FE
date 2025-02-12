import React from 'react';
import { motion } from 'framer-motion';

export const SearchContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
};

export const SearchHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mb-8">{children}</div>;
};

export const SearchControls: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
      {children}
    </div>
  );
};

export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className="flex-1 p-3 rounded-full bg-gray-800 border border-gray-700 focus:outline-none"
    />
  );
};

export const FilterSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <select
      {...props}
      className="p-3 bg-gray-800 border border-gray-700 rounded-full focus:outline-none"
    >
      {props.children}
    </select>
  );
};

export const SearchButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      {...props}
      className="px-6 py-3 bg-[#fa7517] text-black rounded-full hover:bg-[#fa9517] transition-colors"
    >
      {props.children}
    </button>
  );
};

export const ResultsGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{children}</div>;
};

export const PaginationContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-between items-center mt-8">{children}</div>;
};

/* 
  UI Section: Search Result Card Component 
  Displays an individual search result similar to the SubscribedChannel card style.
*/
export interface SearchResultCardProps {
  result: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
  };
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <img
        src={result.thumbnail || '/assets/default-thumbnail.jpg'}
        alt={result.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">{result.title}</h2>
        <p className="text-gray-400 text-sm">{result.description}</p>
      </div>
    </motion.div>
  );
};