// Money comes from cents + currency only — never a hardcoded price.
export const formatMoney = (priceCents: number, currency: string, maximumFractionDigits = 2): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(priceCents / 100);
  } catch {
    // The currency code is not one Intl knows.
    return `${(priceCents / 100).toFixed(2)} ${(currency || '').toUpperCase()}`;
  }
};

/** Plan prices read like prices: "$24" for a whole amount, "$16.58" otherwise. */
export const formatPlanMoney = (priceCents: number, currency: string): string => {
  if (priceCents % 100 !== 0) return formatMoney(priceCents, currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceCents / 100);
  } catch {
    return formatMoney(priceCents, currency);
  }
};
