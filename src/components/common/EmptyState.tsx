// src/components/common/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  imageSrc: string;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  imageSrc,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center text-gray-500 mt-8">
    <img src={imageSrc} alt={title} className="mx-auto mb-4 w-64 h-64" />
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p className="mb-4">{description}</p>
    {buttonText && onButtonClick && (
      <button
        onClick={onButtonClick}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {buttonText}
      </button>
    )}
  </div>
);

export default EmptyState;
