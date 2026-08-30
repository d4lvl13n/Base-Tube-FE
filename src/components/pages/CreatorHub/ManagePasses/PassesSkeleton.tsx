// src/components/pages/CreatorHub/ManagePasses/PassesSkeleton.tsx
import React from 'react';
import { cx, list, skeleton } from '../shared/hubStyles';

const ROWS = 5;

/** Five rows the shape of a pass row, never a full-height grey slab. */
export const PassesSkeleton: React.FC = () => (
  <div className={list.divider} data-testid="passes-skeleton" aria-hidden="true">
    {Array.from({ length: ROWS }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 px-4 py-3">
        <div className={cx(skeleton.thumb, 'w-24 shrink-0 rounded-md')} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className={cx(skeleton.line, 'w-2/5')} />
          <div className={cx(skeleton.line, 'h-3 w-1/4')} />
        </div>
        <div className={cx(skeleton.block, 'h-5 w-14 rounded-full')} />
        <div className={cx(skeleton.line, 'w-12')} />
        <div className={cx(skeleton.line, 'hidden w-20 md:block')} />
      </div>
    ))}
  </div>
);

export default PassesSkeleton;
