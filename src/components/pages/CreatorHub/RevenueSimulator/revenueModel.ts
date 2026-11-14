// src/components/pages/CreatorHub/RevenueSimulator/revenueModel.ts
//
// The arithmetic of the Content Pass revenue simulator. Pure: no React.
//
// It follows the product as it is sold: one fixed price OR a price grid
// that rises by tiers (the first passes cost less), a fixed number of
// passes, the creator keeps 90% of each first sale, and receives a royalty on
// each resale (the decided resale terms). Nothing here assumes a sell-out:
// the number sold comes from the share of the audience that buys, capped by
// the number of passes that exist. With a grid, the passes sold are counted
// cheapest first, so a partial sale earns the early prices.

import { DECIDED_RESALE_TERMS } from '../../../../utils/passTerms';
import { revenueAt, SALES_LEVELS_PCT, type PriceTierDto } from '../../../../utils/passPricing';

/** The creator's share of a first sale. BaseTube keeps the rest. */
export const CREATOR_PRIMARY_PCT = 90;

/** Shares of the audience shown side by side, so one guess is never read as a forecast. */
export const BUYER_SHARE_SCENARIOS: readonly number[] = [1, 2, 5];

export interface SimulatorInputs {
  /** People who follow the creator (subscribers). */
  audience: number;
  /** Share of that audience who buy one pass, in percent (2 = 2%). */
  buyerSharePct: number;
  /** The pass price, in the currency's main unit (10 = 10.00). With a grid: unused. */
  price: number;
  /** A price grid (minor units). When given, it decides the price and the number of passes. */
  tiers?: PriceTierDto[] | null;
  /** How many passes exist. */
  cap: number;
  /** Share of sold passes that change hands in a year, in percent. */
  resoldPerYearPct: number;
  /** The average price of a resale, in the currency's main unit. */
  resalePrice: number;
}

export interface FirstSaleEstimate {
  /** Fans who would buy at this share, before the cap. */
  wouldBuy: number;
  /** Passes actually sold: never more than exist. */
  sold: number;
  soldOut: boolean;
  /** What buyers pay in total. */
  buyersPay: number;
  /** The creator's 90%, before the card fee. */
  creatorEarns: number;
}

export interface SimulatorResult extends FirstSaleEstimate {
  /** Share of the audience that has to buy for every pass to sell, in percent. Null without an audience. */
  shareNeededToSellOutPct: number | null;
  /** The creator's earnings when every pass is sold. */
  creatorEarnsIfSoldOut: number;
  /** Resales in a year. */
  resalesPerYear: number;
  /** The creator's royalty on those resales. */
  royaltyPerYear: number;
  /** First sales plus one year of royalties. */
  firstYearTotal: number;
  /** The same first-sale estimate at each scenario share. */
  scenarios: Array<FirstSaleEstimate & { buyerSharePct: number }>;
  /** What the creator keeps at 25%, 50%, 75% and all sold (never the sell-out figure alone). */
  levels: Array<{ pct: number; sold: number; creatorEarns: number }>;
}

const clean = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);
const round2 = (n: number): number => Math.round(n * 100) / 100;

const gridOk = (tiers: PriceTierDto[] | null | undefined): tiers is PriceTierDto[] => Array.isArray(tiers) && tiers.length >= 2;

/** What buyers pay for `sold` passes: one price, or the grid's cheapest passes first. */
function paidFor(sold: number, price: number, tiers?: PriceTierDto[] | null): number {
  return gridOk(tiers) ? round2(revenueAt(tiers, sold) / 100) : round2(sold * clean(price));
}

export function firstSales(
  audience: number,
  buyerSharePct: number,
  price: number,
  cap: number,
  tiers?: PriceTierDto[] | null
): FirstSaleEstimate {
  const passes = Math.floor(clean(cap));
  const wouldBuy = Math.floor((clean(audience) * clean(buyerSharePct)) / 100);
  const sold = Math.min(wouldBuy, passes);
  const buyersPay = paidFor(sold, price, tiers);
  return {
    wouldBuy,
    sold,
    soldOut: passes > 0 && sold >= passes,
    buyersPay,
    creatorEarns: round2((buyersPay * CREATOR_PRIMARY_PCT) / 100),
  };
}

export function simulate(inputs: SimulatorInputs, royaltyPct: number = DECIDED_RESALE_TERMS.creatorPct): SimulatorResult {
  const audience = clean(inputs.audience);
  const tiers = gridOk(inputs.tiers) ? inputs.tiers : null;
  // A grid states how many passes exist.
  const cap = tiers ? tiers.reduce((sum, t) => sum + t.size, 0) : Math.floor(clean(inputs.cap));
  const price = clean(inputs.price);
  const first = firstSales(audience, inputs.buyerSharePct, price, cap, tiers);

  const resalesPerYear = Math.floor((first.sold * clean(inputs.resoldPerYearPct)) / 100);
  const royaltyPerYear = round2((resalesPerYear * clean(inputs.resalePrice) * royaltyPct) / 100);

  return {
    ...first,
    shareNeededToSellOutPct: audience > 0 && cap > 0 ? (cap / audience) * 100 : null,
    creatorEarnsIfSoldOut: round2((paidFor(cap, price, tiers) * CREATOR_PRIMARY_PCT) / 100),
    resalesPerYear,
    royaltyPerYear,
    firstYearTotal: round2(first.creatorEarns + royaltyPerYear),
    scenarios: BUYER_SHARE_SCENARIOS.map((buyerSharePct) => ({
      buyerSharePct,
      ...firstSales(audience, buyerSharePct, price, cap, tiers),
    })),
    levels: SALES_LEVELS_PCT.map((pct) => {
      const sold = Math.floor((cap * pct) / 100);
      return { pct, sold, creatorEarns: round2((paidFor(sold, price, tiers) * CREATOR_PRIMARY_PCT) / 100) };
    }),
  };
}
