// src/components/pages/CreatorHub/ManagePasses/PassStatusPill.tsx
import React from 'react';
import type { Pass } from '../../../../types/pass';
import { cx, passStatusPill } from '../Business/businessStyles';

/**
 * A pass's lifecycle in three words, like the video status vocabulary:
 * Draft · Live · Publish failed — plus Paused when a live pass is not selling,
 * Not on sale when it is published but cannot be bought, and Publishing while
 * the chain transaction is in flight. Used when the business numbers (which
 * also know the platform-wide switch) are not loaded; see saleState.
 */
export type PassLifecycle = 'draft' | 'publishing' | 'live' | 'paused' | 'blocked' | 'failed';

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
      if (saleIsPaused(pass)) return 'paused';
      // Published is not "on sale": never say Live when the API says nobody can buy it.
      return pass.can_purchase === false ? 'blocked' : 'live';
  }
}

const LABEL: Record<PassLifecycle, string> = {
  draft: 'Draft',
  publishing: 'Publishing',
  live: 'Live',
  paused: 'Paused',
  blocked: 'Not on sale',
  failed: 'Publish failed',
};

const TONE: Record<PassLifecycle, string> = {
  draft: passStatusPill.draft,
  publishing: passStatusPill.publishing,
  live: passStatusPill.live,
  paused: passStatusPill.paused,
  blocked: passStatusPill.paused,
  failed: passStatusPill.failed,
};

/** `Label` or `Label · reason` when the API says why. */
export function passStatusText(pass: Pass): string {
  const lifecycle = passLifecycle(pass);
  const label = LABEL[lifecycle];
  if ((lifecycle === 'paused' || lifecycle === 'blocked') && pass.purchase_block_reason) {
    return `${label} · ${pass.purchase_block_reason}`;
  }
  return label;
}

/** One short pill ("Paused", "Not on sale"…); the API's reason, when there is one, is its tooltip. */
export const PassStatusPill: React.FC<{ pass: Pass; className?: string }> = ({ pass, className }) => {
  const lifecycle = passLifecycle(pass);
  return (
    <span className={cx(passStatusPill.base, TONE[lifecycle], 'max-w-full truncate', className)} title={passStatusText(pass)}>
      {LABEL[lifecycle]}
    </span>
  );
};

export default PassStatusPill;
