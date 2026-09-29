import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ScanSearch } from 'lucide-react';

/** The main call to action (the free trial or plan button): warm gradient with a light sweeping across. */
export const primaryButton =
  'lp-btn-primary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60';

/**
 * "Review a thumbnail": a rotating orange light along the border, the scan icon, and a FREE tag for
 * visitors (their reviews are free; a signed-in review uses credits, so the tag is not shown).
 */
export function ReviewButton({ signedIn, className = '' }: { signedIn: boolean; className?: string }) {
  return (
    <Link
      to="/ai-thumbnails/audit"
      className={`lp-btn-secondary group inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full pl-3 pr-6 text-base font-semibold text-white ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fa7517]/15 text-[#fa7517] transition-colors group-hover:bg-[#fa7517] group-hover:text-white">
        <ScanSearch className="h-4 w-4" aria-hidden="true" />
      </span>
      Review a thumbnail
      {!signedIn && (
        <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide text-black">FREE</span>
      )}
      <ArrowRight className="-ml-1 h-4 w-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" aria-hidden="true" />
    </Link>
  );
}
