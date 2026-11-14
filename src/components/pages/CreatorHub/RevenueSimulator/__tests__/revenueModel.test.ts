import { firstSales, simulate } from '../revenueModel';

describe('Content Pass revenue simulator', () => {
  it('sells to the share of the audience that buys, at one fixed price, and pays the creator 90%', () => {
    // 5,000 followers, 2% buy = 100 passes at 10 = 1,000 paid, 900 for the creator.
    expect(firstSales(5000, 2, 10, 500)).toEqual({
      wouldBuy: 100,
      sold: 100,
      soldOut: false,
      buyersPay: 1000,
      creatorEarns: 900,
    });
  });

  it('never sells more passes than exist', () => {
    const r = firstSales(100_000, 5, 5, 500);
    expect(r.wouldBuy).toBe(5000);
    expect(r.sold).toBe(500);
    expect(r.soldOut).toBe(true);
    expect(r.creatorEarns).toBe(2250);
  });

  it('adds a 5% royalty on each resale', () => {
    const r = simulate({ audience: 10_000, buyerSharePct: 5, price: 10, cap: 500, resoldPerYearPct: 20, resalePrice: 30 });
    expect(r.sold).toBe(500);
    expect(r.creatorEarns).toBe(4500);
    expect(r.resalesPerYear).toBe(100);
    expect(r.royaltyPerYear).toBe(150); // 100 resales x 30 x 5%
    expect(r.firstYearTotal).toBe(4650);
    expect(r.shareNeededToSellOutPct).toBe(5);
    expect(r.creatorEarnsIfSoldOut).toBe(4500);
  });

  it('shows the same pass at 1%, 2% and 5% of the audience', () => {
    const r = simulate({ audience: 5000, buyerSharePct: 2, price: 5, cap: 500, resoldPerYearPct: 0, resalePrice: 5 });
    expect(r.scenarios.map((s) => [s.buyerSharePct, s.sold, s.creatorEarns])).toEqual([
      [1, 50, 225],
      [2, 100, 450],
      [5, 250, 1125],
    ]);
  });

  it('gives zeros for empty or invalid entries', () => {
    const r = simulate({ audience: NaN, buyerSharePct: -1, price: 0, cap: 0, resoldPerYearPct: 10, resalePrice: 5 });
    expect(r.sold).toBe(0);
    expect(r.creatorEarns).toBe(0);
    expect(r.royaltyPerYear).toBe(0);
    expect(r.shareNeededToSellOutPct).toBeNull();
  });
});
