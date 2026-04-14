import type {
  OnchainPurchaseStatus,
  OnchainPurchaseStatusData,
  OnchainPurchaseStatusResponse,
  PendingPurchase,
} from '../types/onchainPass';

export const ACCESS_GRANTING_PURCHASE_STATUSES: OnchainPurchaseStatus[] = [
  'pending',
  'minting',
  'claimed',
  'minted',
  'claiming',
  'completed',
];

export const TERMINAL_PURCHASE_STATUSES: OnchainPurchaseStatus[] = [
  'claimed',
  'minted',
  'completed',
  'failed',
  'expired',
  'refunded',
  'disputed',
];

export const NEGATIVE_PURCHASE_STATUSES: OnchainPurchaseStatus[] = [
  'failed',
  'expired',
  'refunded',
  'disputed',
];

export const CLAIM_IN_PROGRESS_STATUSES: OnchainPurchaseStatus[] = [
  'minting',
  'claiming',
];

export function hasPurchaseEntitlement(status?: string | null): boolean {
  return Boolean(status && ACCESS_GRANTING_PURCHASE_STATUSES.includes(status as OnchainPurchaseStatus));
}

export function isPurchaseTerminal(status?: string | null): boolean {
  return Boolean(status && TERMINAL_PURCHASE_STATUSES.includes(status as OnchainPurchaseStatus));
}

export function isNegativePurchaseStatus(status?: string | null): boolean {
  return Boolean(status && NEGATIVE_PURCHASE_STATUSES.includes(status as OnchainPurchaseStatus));
}

export function canClaimPurchase(status?: string | null, paymentType?: string | null): boolean {
  return status === 'pending' && paymentType === 'stripe';
}

export function getPurchaseDisplayCopy(status?: string | null): {
  label: string;
  helper: string;
} {
  switch (status) {
    case 'reserved':
    case 'open':
      return {
        label: 'Checkout reserved',
        helper: 'Your reservation exists, but payment is not confirmed yet.',
      };
    case 'pending':
      return {
        label: 'Paid, access unlocked',
        helper: 'NFT not minted yet. Claim it to your wallet when you are ready.',
      };
    case 'minting':
    case 'claiming':
      return {
        label: 'Minting to your wallet',
        helper: 'Your pass is unlocked while the NFT claim is being processed.',
      };
    case 'claimed':
    case 'minted':
    case 'completed':
      return {
        label: 'NFT in your wallet',
        helper: 'Your purchase is complete and the NFT is already in your wallet.',
      };
    case 'expired':
      return {
        label: 'Reservation expired',
        helper: 'This checkout expired before payment completed. Start a new purchase to continue.',
      };
    case 'failed':
      return {
        label: 'Purchase failed',
        helper: 'We could not finalize this purchase. Please try again.',
      };
    case 'refunded':
      return {
        label: 'Purchase refunded',
        helper: 'This purchase was refunded and no longer grants access.',
      };
    case 'disputed':
      return {
        label: 'Purchase disputed',
        helper: 'This purchase is under dispute and access may be restricted.',
      };
    default:
      return {
        label: 'Processing purchase',
        helper: 'We are still checking the latest purchase status.',
      };
  }
}

export function normalizePurchaseStatusResponse(raw: any): OnchainPurchaseStatusResponse {
  if (raw?.success && raw?.data) {
    return raw as OnchainPurchaseStatusResponse;
  }

  const payload = raw?.data && raw?.status == null ? raw.data : raw;
  const pass = payload?.pass
    ? {
        id: payload.pass.id,
        title: payload.pass.title,
        description: payload.pass.description ?? null,
        supplyCap: payload.pass.supplyCap ?? payload.pass.supply_cap ?? null,
        mintedCount: Number(payload.pass.mintedCount ?? payload.pass.minted_count ?? 0),
        reservedCount: Number(payload.pass.reservedCount ?? payload.pass.reserved_count ?? 0),
      }
    : null;

  const data: OnchainPurchaseStatusData = {
    status: payload?.status,
    purchaseId: payload?.purchaseId ?? payload?.purchase_id ?? '',
    passId: payload?.passId ?? payload?.pass_id ?? '',
    priceCents: Number(payload?.priceCents ?? payload?.price_cents ?? 0),
    currency: payload?.currency ?? 'EUR',
    paymentType: payload?.paymentType ?? payload?.payment_type ?? 'stripe',
    stripePaymentId: payload?.stripePaymentId ?? payload?.stripe_payment_id ?? null,
    paymentHash: payload?.paymentHash ?? payload?.payment_hash ?? null,
    txHash: payload?.txHash ?? payload?.tx_hash ?? null,
    mintTxHash: payload?.mintTxHash ?? payload?.mint_tx_hash ?? null,
    claimTxHash: payload?.claimTxHash ?? payload?.claim_tx_hash ?? null,
    mintTxUrl: payload?.mintTxUrl ?? payload?.mint_tx_url ?? null,
    claimTxUrl: payload?.claimTxUrl ?? payload?.claim_tx_url ?? null,
    ownerAddress: payload?.ownerAddress ?? payload?.owner_address ?? null,
    reservationExpiresAt: payload?.reservationExpiresAt ?? payload?.reservation_expires_at ?? payload?.expires_at ?? null,
    lastStatusReason: payload?.lastStatusReason ?? payload?.last_status_reason ?? null,
    lastCheckedAt: payload?.lastCheckedAt ?? payload?.last_checked_at ?? null,
    pass,
  };

  return {
    success: true,
    data,
  };
}

export function normalizePendingPurchase(raw: any): PendingPurchase {
  return {
    id: raw?.id ?? raw?.purchaseId ?? raw?.purchase_id ?? '',
    passId: raw?.passId ?? raw?.pass_id ?? raw?.pass?.id ?? '',
    status: raw?.status ?? 'pending',
    priceCents: Number(raw?.priceCents ?? raw?.price_cents ?? 0),
    currency: raw?.currency ?? 'EUR',
    createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    reservationExpiresAt: raw?.reservationExpiresAt ?? raw?.reservation_expires_at ?? null,
    pass: {
      id: raw?.pass?.id ?? raw?.passId ?? raw?.pass_id ?? '',
      title: raw?.pass?.title ?? 'Untitled pass',
      description: raw?.pass?.description ?? null,
      tier: raw?.pass?.tier ?? 'bronze',
      slug: raw?.pass?.slug ?? '',
    },
  };
}

export function getExplorerTxUrl(hash?: string | null, chainId?: number | null): string | undefined {
  if (!hash) return undefined;
  if (chainId === 84532) return `https://sepolia.basescan.org/tx/${hash}`;
  return `https://basescan.org/tx/${hash}`;
}
