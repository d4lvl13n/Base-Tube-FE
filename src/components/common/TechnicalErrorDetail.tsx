import React from 'react';
import { showTechnicalErrors } from '../../utils/plainApiError';

/** The HTTP status / error code after a plain error message, in development only. */
export function TechnicalErrorDetail({ detail, className = '' }: { detail?: string | null; className?: string }) {
  if (!detail || !showTechnicalErrors()) return null;
  return (
    <span data-testid="technical-error-detail" className={`ml-1.5 font-mono text-[11px] text-zinc-500 ${className}`}>
      ({detail})
    </span>
  );
}

export default TechnicalErrorDetail;
