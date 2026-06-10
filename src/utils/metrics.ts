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
  | 'onchain.crypto.purchase.accepted'
  | 'onchain.crypto.confirm.attempt'
  | 'onchain.crypto.confirm.success'
  | 'onchain.crypto.confirm.give_up'
  | 'onchain.crypto.confirm.hard_conflict'
  | 'onchain.crypto.confirm.retry.attempt'
  | 'onchain.crypto.confirm.retry.success'
  | 'onchain.crypto.confirm.retry.failed'
  | 'onchain.crypto.confirm.retry.hard_conflict'
  | 'onchain.crypto.polling.timeout'
  | 'onchain.crypto.resume.start'
  | 'onchain.crypto.resume.success'
  | 'onchain.crypto.resume.give_up'
  | 'onchain.crypto.resume.hard_conflict'
  | 'onchain.pending.fetch'
  | 'onchain.mint.pending.start'
  | 'onchain.mint.pending.complete'
  | 'onchain.mint.pending.error';

export function trackOnchainEvent(event: OnchainEventName, data?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[metrics] ${event}`, data || {});
  }
  // TODO: send to analytics backend when available
}


