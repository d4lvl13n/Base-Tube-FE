// src/components/common/Error.tsx

import React from 'react';

interface ErrorProps {
  message: string;
}

const Error: React.FC<ErrorProps> = ({ message }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <p className="text-red-500 text-xl">{message}</p>
    </div>
  </div>
);

export default Error;
