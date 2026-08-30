// src/components/pages/CreatorHub/ManagePasses/PassStatusPill.tsx
import React from 'react';
import type { Pass } from '../../../../types/pass';
import { cx, passStatusPill } from '../shared/hubStyles';

/**
 * A pass's lifecycle in three words, like the video status vocabulary:
 * Draft · Live · Publish failed — plus Paused when a live pass is not selling
 * and Publishing while the chain transaction is in flight.
 */
export type PassLifecycle = 'draft' | 'publishing' | 'live' | 'paused' | 'failed';

/**
 * `sale_active` comes back from the API (it is a Pass model column) but is not
 * on the client type; `purchase_block_reason_code` is, and says the same thing.
 * Both are read so a missing field never turns a live pass into a paused one.
 */
const saleIsPaused = (pass: Pass): boolean => {
  const saleActive = (pass as Pass & { sale_active?: boolean }).sale_active;
  if (saleActive === false) return true;
  return pass.purchase_block_reason_code === 'PASS_SALE_INACTIVE';
};

export function passLifecycle(pass: Pass): PassLifecycle {
  switch (pass.publish_status) {
    case 'draft':
      return 'draft';
    case 'publishing':
      return 'publishing';
    case 'publish_failed':
      return 'failed';
    default:
      return saleIsPaused(pass) ? 'paused' : 'live';
  }
}

const LABEL: Record<PassLifecycle, string> = {
  draft: 'Draft',
  publishing: 'Publishing',
  live: 'Live',
  paused: 'Paused',
  failed: 'Publish failed',
};

const TONE: Record<PassLifecycle, string> = {
  draft: passStatusPill.draft,
  publishing: passStatusPill.publishing,
  live: passStatusPill.live,
  paused: passStatusPill.paused,
  failed: passStatusPill.failed,
};

/** `Label` or `Label · reason` when the API says why. */
export function passStatusText(pass: Pass): string {
  const lifecycle = passLifecycle(pass);
  const label = LABEL[lifecycle];
  if (lifecycle === 'paused' && pass.purchase_block_reason) {
    return `${label} · ${pass.purchase_block_reason}`;
  }
  return label;
}

export const PassStatusPill: React.FC<{ pass: Pass; className?: string }> = ({ pass, className }) => {
  const lifecycle = passLifecycle(pass);
  const text = passStatusText(pass);
  return (
    <span className={cx(passStatusPill.base, TONE[lifecycle], 'max-w-full truncate', className)} title={text}>
      {text}
    </span>
  );
};

export default PassStatusPill;
