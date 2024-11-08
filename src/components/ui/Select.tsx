import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, options }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="inline-flex items-center justify-between rounded-md px-3 py-2 text-sm bg-black/50 hover:bg-black/70 text-gray-200 w-[180px] border border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#fa7517] focus:border-transparent"
    >
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          className="bg-black text-gray-200"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};