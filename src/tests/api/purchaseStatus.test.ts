import {
  canClaimPurchase,
  getPurchaseDisplayCopy,
  hasPurchaseEntitlement,
  normalizePendingPurchase,
  normalizePurchaseStatusResponse,
} from '../../utils/purchaseStatus';

describe('content-pass purchase normalization', () => {
  it('normalizes wrapped purchase status responses', () => {
    const normalized = normalizePurchaseStatusResponse({
      success: true,
      data: {
        status: 'pending',
        purchaseId: 'purchase_123',
        passId: 'pass_123',
        priceCents: 1500,
        currency: 'EUR',
        paymentType: 'stripe',
        reservationExpiresAt: '2026-04-14T12:34:56.000Z',
        pass: {
          id: 'pass_123',
          title: 'Premium Pass',
          mintedCount: 10,
          reservedCount: 4,
        },
      },
    });

    expect(normalized.data?.status).toBe('pending');
    expect(normalized.data?.purchaseId).toBe('purchase_123');
    expect(normalized.data?.pass?.reservedCount).toBe(4);
  });

  it('normalizes flat snake_case purchase status responses', () => {
    const normalized = normalizePurchaseStatusResponse({
      status: 'claimed',
      purchase_id: 'purchase_456',
      pass_id: 'pass_456',
      price_cents: 2000,
      currency: 'USD',
      payment_type: 'crypto',
      owner_address: '0xabc',
      reservation_expires_at: '2026-04-14T13:00:00.000Z',
      pass: {
        id: 'pass_456',
        title: 'On-chain Pass',
        minted_count: 18,
        reserved_count: 2,
      },
    });

    expect(normalized.data?.status).toBe('claimed');
    expect(normalized.data?.purchaseId).toBe('purchase_456');
    expect(normalized.data?.ownerAddress).toBe('0xabc');
    expect(normalized.data?.pass?.mintedCount).toBe(18);
  });

  it('normalizes pending purchase list items', () => {
    const purchase = normalizePendingPurchase({
      purchase_id: 'purchase_789',
      pass_id: 'pass_789',
      status: 'pending',
      price_cents: 2500,
      currency: 'EUR',
      created_at: '2026-04-14T10:00:00.000Z',
      reservation_expires_at: '2026-04-14T10:30:00.000Z',
      pass: {
        id: 'pass_789',
        title: 'Creator Vault',
        tier: 'bronze',
      },
    });

    expect(purchase.id).toBe('purchase_789');
    expect(purchase.passId).toBe('pass_789');
    expect(purchase.reservationExpiresAt).toBe('2026-04-14T10:30:00.000Z');
  });
});

describe('content-pass purchase UX rules', () => {
  it('grants access for pending, minting, and claimed purchases', () => {
    expect(hasPurchaseEntitlement('pending')).toBe(true);
    expect(hasPurchaseEntitlement('minting')).toBe(true);
    expect(hasPurchaseEntitlement('claimed')).toBe(true);
    expect(hasPurchaseEntitlement('reserved')).toBe(false);
  });

  it('only allows explicit claim CTA for pending Stripe purchases', () => {
    expect(canClaimPurchase('pending', 'stripe')).toBe(true);
    expect(canClaimPurchase('pending', 'crypto')).toBe(false);
    expect(canClaimPurchase('claimed', 'stripe')).toBe(false);
  });

  it('returns updated copy for the new reservation model', () => {
    expect(getPurchaseDisplayCopy('pending').label).toBe('Paid, access unlocked');
    expect(getPurchaseDisplayCopy('minting').label).toBe('Minting to your wallet');
    expect(getPurchaseDisplayCopy('claimed').label).toBe('NFT in your wallet');
  });
});
