// src/components/common/Loader.tsx

import React from 'react';

const Loader: React.FC<{ fullPage?: boolean; label?: string }> = ({ fullPage = false, label }) => (
  <div role="status" aria-live="polite" className={`flex flex-col justify-center items-center gap-5 ${fullPage ? 'min-h-screen bg-[#09090B] px-6 text-center text-zinc-300' : 'h-64'}`}>
    <div aria-hidden="true" className="loader animate-spin rounded-full border-4 border-zinc-700 border-t-[#fa7517] h-12 w-12"></div>
    {label && <p>{label}</p>}
    {fullPage && <p className="max-w-sm text-sm text-zinc-400">On a slow connection this can take a moment. If it stays here, <button className="text-orange-400 underline" onClick={() => window.location.reload()}>reload the page</button>.</p>}
  </div>
);

export default Loader;
