/**
 * "How Business numbers are counted": the help page's content. Pure, unit-tested.
 *
 * The sentences come from the API (`definitions` of GET /creator/business/overview),
 * in the screens' words ("your earnings", not "your share"). When the API is not
 * reachable, the copy below is shown instead: the same sentences as the API's
 * own list (base-be src/modules/creatorBusiness/definitions.ts). Fees, gross
 * sales and net received are not listed: the screens show the creator's
 * earnings only.
 */
import type { DefinitionKey, Definitions } from '../../../../types/creatorBusiness';
import { EARNINGS_LABEL, earningsCardFeeLine, earningsDefinition, earningsWording } from './businessFormat';

export const HELP_PATH = '/creator-hub/business/help';

/** The API's sentences, used only when the API does not answer. */
export const FALLBACK_DEFINITIONS: Partial<Definitions> = {
  days: 'Days are UTC calendar days (midnight to midnight UTC). Both the start day and the end day are included.',
  paymentMoment:
    'A purchase belongs to the day it was paid (when access was granted). Purchases recorded before that moment was stored use the day the checkout was created.',
  purchase:
    'A purchase is one paid checkout. Refunded and disputed purchases still count as purchases; checkouts that were never paid do not.',
  unit: 'Units are passes sold: a purchase of 3 passes is 1 purchase and 3 units.',
  platformFee: "BaseTube's fee is the 10% taken from each sale.",
  proceeds: "Your earnings are what buyers paid minus BaseTube's fee, for purchases that are not refunded or disputed.",
  earningsBeforeCardFee:
    'Your earnings are shown before the card processing fee. On each card sale, the payment provider (Stripe) also takes its own fee from your Stripe account, so what you receive for card sales is lower than the earnings shown here.',
  amountUnknown:
    'Some early purchases were recorded without their amount. They are counted as purchases but their money is not added, so totals are never guessed.',
  buyer: 'A buyer is a distinct person who paid you at least once in the selected days.',
  newBuyer: 'A new buyer is a buyer whose first paid purchase with you, on any of your channels, is in the selected days.',
  returningBuyer: 'A returning buyer is a buyer who had already paid you before the selected days.',
  activeHolder: 'Active holders are people who can open at least one of your passes right now.',
  neverOpened:
    'Never opened counts active holders who have not opened any pass they hold yet. The customers filter "never opened" uses the same rule.',
  opened:
    'A pass is opened when the buyer asked to play one of its videos (we gave them a playback link). Videos opened counts the different videos they asked to play, across the passes they hold. It does not tell how long they watched. Your own plays are not counted.',
  refunded:
    'Refunded purchases had their money returned and the access removed. They are taken out of sales and of your earnings, even when only part of the price was returned; the refund lines show how much went back. A small refund that left the access in place stays in your earnings.',
  disputed: 'Disputed purchases were contested by the buyer with their bank. They are taken out of sales and of your earnings.',
  checkoutStarted: 'Checkouts started counts distinct signed-in people who opened a checkout for one of your passes in the selected days.',
  paidCheckout: 'Paid counts, among those people, the ones who paid from a checkout started in the selected days.',
  abandoned: 'Abandoned counts the people who started a checkout and did not pay. They are only ever shown as a number, never by name.',
  visits:
    'Visits are views of your pass sales pages. Repeat views by the same visitor within 30 minutes count once. Visits were not counted before the date shown.',
  uniqueVisitors:
    'Unique visitors counts each visitor once per pass and per day. Over several days the days are added up, so someone who came on 2 days counts 2.',
  source:
    'The source is where the buyer came from on the visit that led to the checkout (the last source that was not a direct visit). Purchases made before sources were recorded show as Unknown.',
  previousPeriod: 'The previous period has the same number of days and ends the day before the selected start day.',
  currencies: 'Card sales are in the pass currency (2 decimals). Crypto sales are in USDC (6 decimals). They are always shown apart.',
  conversion:
    'Visit to paid is the people who paid divided by unique visitors. Checkout to paid is the people who paid divided by the people who started a checkout. Both are empty when the number to divide by is unknown or zero.',
  allTime:
    'All time starts on the day of the first checkout or payment on these passes and ends today. There is no previous period to compare with.',
  series:
    'The chart shows one point per day for up to 92 days, one per week (Monday to Sunday, UTC) for up to 2 years, and one per month beyond. A week or month cut by the start or end of the period only counts the days inside it.',
  canContact:
    'Can contact means the buyer agreed at checkout that you may contact them and has not withdrawn it. The date is when they agreed. A withdrawn agreement is never shown.',
};

export interface HelpEntry {
  term: string;
  sentence: string;
}

export interface HelpSection {
  id: string;
  title: string;
  entries: HelpEntry[];
}

/** A term from the API's list, or a sentence the screens write themselves. */
type Item = [DefinitionKey, string] | { term: string; sentence: string };

const GROUPS: Array<{ id: string; title: string; items: Item[] }> = [
  {
    id: 'earnings',
    title: 'Earnings',
    items: [
      ['refunded', 'Refunded'],
      ['disputed', 'Disputed'],
      ['amountUnknown', 'No recorded amount'],
      ['currencies', 'Currencies'],
      ['paymentMoment', 'When a purchase counts'],
    ],
  },
  {
    id: 'buyers',
    title: 'Buyers and passes',
    items: [
      ['purchase', 'Purchases'],
      ['unit', 'Passes sold'],
      ['buyer', 'Buyers'],
      ['newBuyer', 'New buyers'],
      ['returningBuyer', 'Returning buyers'],
      ['activeHolder', 'Active holders'],
      {
        term: 'Sold (on the Passes page)',
        sentence: 'How many passes have been sold since the pass went on sale, out of the number of passes that exist.',
      },
    ],
  },
  {
    id: 'visits',
    title: 'Visits and conversion',
    items: [
      ['visits', 'Visits'],
      ['uniqueVisitors', 'Unique visitors'],
      ['checkoutStarted', 'Checkouts started'],
      ['paidCheckout', 'Paid'],
      ['abandoned', 'Abandoned'],
      ['conversion', 'Conversion'],
      ['source', 'Source'],
    ],
  },
  {
    id: 'opened',
    title: 'Opened and watched',
    items: [
      ['opened', 'Opened'],
      ['neverOpened', 'Not opened yet'],
      {
        term: 'Started and finished',
        sentence:
          'Started and finished count buyers who watched a video in the BaseTube player. “Of N buyers” counts the people who hold the pass now.',
      },
      {
        term: 'Your own previews',
        sentence: 'When you play your own videos, it is shown apart and never counted as a buyer.',
      },
    ],
  },
  {
    id: 'periods',
    title: 'Days and periods',
    items: [
      ['days', 'Days'],
      ['previousPeriod', 'Previous period'],
      ['allTime', 'All time'],
      ['series', 'Chart points'],
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and contact',
    items: [
      ['canContact', 'Can email'],
      {
        term: 'Email addresses',
        sentence:
          'You see a buyer’s email only when they were told at checkout that it is shared with you. Otherwise the screens say why it is hidden.',
      },
      {
        term: 'Watch averages',
        sentence: 'Average watched and watch time are shown only once enough buyers have watched, so no single buyer’s viewing can be read from them.',
      },
    ],
  },
];

/**
 * The help page's sections, the API's sentences first and the copy above
 * where the API sends none. The earnings sentence comes first, with the one
 * line about the card fee.
 */
export function helpSections(api: Partial<Definitions> | undefined | null): HelpSection[] {
  const defs: Partial<Definitions> = { ...FALLBACK_DEFINITIONS };
  if (api) {
    (Object.keys(api) as DefinitionKey[]).forEach((key) => {
      const value = api[key];
      if (typeof value === 'string' && value.trim()) defs[key] = value;
    });
  }
  const earnings = earningsDefinition(defs);
  const cardFee = earningsCardFeeLine(defs);

  return GROUPS.map((group) => {
    const entries: HelpEntry[] = group.items
      .map((item): HelpEntry | null => {
        if (!Array.isArray(item)) return item;
        const [key, term] = item;
        const sentence = defs[key];
        return typeof sentence === 'string' ? { term, sentence: earningsWording(sentence) } : null;
      })
      .filter((entry): entry is HelpEntry => entry !== null);
    if (group.id === 'earnings') {
      entries.unshift({ term: EARNINGS_LABEL, sentence: earnings ? `${earnings} ${cardFee}` : cardFee });
    }
    return { id: group.id, title: group.title, entries };
  }).filter((section) => section.entries.length > 0);
}
