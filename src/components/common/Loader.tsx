// src/components/common/Loader.tsx

import React from 'react';

const Loader: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
  </div>
);

export default Loader;
