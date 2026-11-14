// What a buyer reads on a pass page when it cannot be bought, by the API's
// `purchase_block_reason_code`. Honest about why: a paused or sold-out pass
// is not "still being set up". Never says who paused it.

export interface PublicSaleCopy {
  headline: string;
  body: string;
  /** Short form for the sticky header. */
  short: string;
}

export function publicSaleCopy(pass: { can_purchase?: boolean; purchase_block_reason_code?: string | null }): PublicSaleCopy | null {
  if (pass.can_purchase !== false) return null;
  switch (pass.purchase_block_reason_code) {
    case 'PASS_SALE_INACTIVE':
      return {
        headline: 'Sales of this pass are paused.',
        body: 'Nobody can buy it right now. People who already bought it keep their access to every video.',
        short: 'Sales paused',
      };
    case 'PASS_SOLD_OUT':
      return {
        headline: 'This pass is sold out.',
        body: 'Every pass of this edition has been sold, and no more will be made. Holders can resell theirs on the BaseTube marketplace.',
        short: 'Sold out',
      };
    case 'PASS_NOT_PUBLISHED':
    case 'PASS_NOT_ONCHAIN':
      return {
        headline: 'This pass is not for sale yet.',
        body: 'The creator is still setting it up. Card and crypto checkout stay off until it is published.',
        short: 'Not for sale yet',
      };
    default:
      return {
        headline: 'This pass cannot be bought right now.',
        body: 'Check back later. People who already bought it keep their access.',
        short: 'Not on sale',
      };
  }
}
