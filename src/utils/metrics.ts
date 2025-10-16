type OnchainEventName =
  | 'onchain.purchase.poll.start'
  | 'onchain.purchase.poll.stop'
  | 'onchain.purchase.status'
  | 'onchain.claim.submit'
  | 'onchain.claim.success'
  | 'onchain.claim.error'
  | 'onchain.access.check'
  | 'onchain.access.list'
  | 'onchain.crypto.purchase.start'
  | 'onchain.crypto.purchase.accepted';

export function trackOnchainEvent(event: OnchainEventName, data?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[metrics] ${event}`, data || {});
  }
  // TODO: send to analytics backend when available
}


