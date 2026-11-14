// src/components/pages/CreatorHub/RevenueSimulator/RevenueSimulator.tsx
//
// The Content Pass revenue simulator: what a pass could earn its creator,
// from the audience, one fixed price or a price grid that rises by tiers,
// and the number of passes that exist.
// Used on its own page and in the side panel of the pass creation wizard
// (where the price and the number of passes follow the form).
import React, { useId, useMemo, useState } from 'react';
import { cx, field, segmented, surface, text } from '../Business/businessStyles';
import { formatCount, formatMinor } from '../Business/businessFormat';
import { DECIDED_RESALE_TERMS, passesText, pctText } from '../../../../utils/passTerms';
import { CREATOR_PRIMARY_PCT, simulate } from './revenueModel';
import {
  DEFAULT_TIER_COUNT,
  MIN_PRICE_TIERS,
  buildTiers,
  maxTierCountFor,
  priceRangeText,
  type PriceTierDto,
} from '../../../../utils/passPricing';

export interface LinkedPass {
  /** Price in the currency's main unit, when the form has one. */
  price?: number;
  cap?: number;
  currency?: string;
  /** The grid, when the pass's price rises by tiers (minor units). */
  tiers?: PriceTierDto[];
}

interface RevenueSimulatorProps {
  /** The pass being created: its price and number of passes are read from the form, not typed here. */
  linked?: LinkedPass;
  /** `page`: entries and results side by side on a wide screen. `panel`: one column. */
  layout?: 'page' | 'panel';
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'USDC'] as const;

const toNumber = (value: string): number => {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const NumberField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  suffix?: string;
  placeholder?: string;
}> = ({ label, value, onChange, help, suffix, placeholder }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={field.label}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9.,]/g, ''))}
          aria-describedby={help ? `${id}-help` : undefined}
          className={cx(field.input, 'tabular-nums', suffix && 'pr-10')}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{suffix}</span>
        )}
      </div>
      {help && (
        <p id={`${id}-help`} className={cx(text.note, 'mt-1.5')}>
          {help}
        </p>
      )}
    </div>
  );
};

const Line: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <span className={text.label}>{label}</span>
    <span className={cx('whitespace-nowrap tabular-nums', strong ? 'text-base font-semibold text-white' : 'text-sm text-gray-200')}>
      {value}
    </span>
  </div>
);

const RevenueSimulator: React.FC<RevenueSimulatorProps> = ({ linked, layout = 'page' }) => {
  const [audience, setAudience] = useState('5000');
  const [buyerShare, setBuyerShare] = useState('2');
  const [ownPrice, setOwnPrice] = useState('10');
  const [ownCap, setOwnCap] = useState('500');
  const [ownCurrency, setOwnCurrency] = useState<string>('EUR');
  const [ownTiered, setOwnTiered] = useState(false);
  const [ownFinalPrice, setOwnFinalPrice] = useState('25');
  const [ownTierCount, setOwnTierCount] = useState(String(DEFAULT_TIER_COUNT));
  const [resold, setResold] = useState('10');
  const [resalePriceInput, setResalePriceInput] = useState('');
  const currencyId = useId();

  const price = linked ? linked.price ?? 0 : toNumber(ownPrice);
  const cap = linked ? linked.cap ?? 0 : toNumber(ownCap);
  const currency = (linked ? linked.currency : ownCurrency) || 'EUR';
  // A grid: the form's own, or one built here from a start and a final price.
  const ownGrid = useMemo(() => {
    if (linked || !ownTiered) return { tiers: null as PriceTierDto[] | null, error: null as string | null };
    const out = buildTiers({
      supplyCap: Math.floor(cap),
      startPriceCents: Math.round(price * 100),
      finalPriceCents: Math.round(toNumber(ownFinalPrice) * 100),
      count: Math.floor(toNumber(ownTierCount)),
    });
    return 'tiers' in out ? { tiers: out.tiers, error: null } : { tiers: null, error: out.error };
  }, [linked, ownTiered, cap, price, ownFinalPrice, ownTierCount]);
  const tiers = linked ? linked.tiers ?? null : ownGrid.tiers;
  // Until the creator types one, a resale is counted at the pass's own price.
  const resalePrice = resalePriceInput === '' ? price : toNumber(resalePriceInput);
  const royaltyPct = DECIDED_RESALE_TERMS.creatorPct;

  const result = useMemo(
    () =>
      simulate(
        { audience: toNumber(audience), buyerSharePct: toNumber(buyerShare), price, cap, tiers, resoldPerYearPct: toNumber(resold), resalePrice },
        royaltyPct,
      ),
    [audience, buyerShare, price, cap, tiers, resold, resalePrice, royaltyPct],
  );

  const money = (amount: number): string => formatMinor(Math.round(amount * 100), currency, 2);
  const ready = (tiers ? true : price > 0) && cap > 0;

  const entries = (
    <div className="space-y-6">
      <section className={cx(surface.card, 'space-y-4 p-5')}>
        <h3 className={text.cardTitle}>Your audience</h3>
        <NumberField
          label="Subscribers"
          value={audience}
          onChange={setAudience}
          help="The people who follow you today, on YouTube or elsewhere."
        />
        <NumberField
          label="Share of them who buy"
          value={buyerShare}
          onChange={setBuyerShare}
          suffix="%"
          help="Nobody knows this number before selling. 1% to 2% is a careful guess; 5% is a strong launch."
        />
      </section>

      <section className={cx(surface.card, 'space-y-4 p-5')}>
        <h3 className={text.cardTitle}>Your pass</h3>
        {linked ? (
          <>
            <div className={cx('divide-y', surface.hairline)}>
              {tiers ? (
                <Line label="Price grid" value={`${priceRangeText({ price_cents: tiers[0].priceCents, price_tiers: tiers, currency })} · ${tiers.length} tiers`} />
              ) : (
                <Line label="Price" value={price > 0 ? money(price) : 'Not set yet'} />
              )}
              <Line label="Passes that exist" value={cap > 0 ? passesText(cap) : 'Not set yet'} />
            </div>
            <p className={text.note}>These follow the form on the left. Change them there and the figures update.</p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
              <NumberField label="Price" value={ownPrice} onChange={setOwnPrice} />
              <div>
                <label htmlFor={currencyId} className={field.label}>
                  Currency
                </label>
                <select
                  id={currencyId}
                  value={ownCurrency}
                  onChange={(event) => setOwnCurrency(event.target.value)}
                  className={cx(field.input, 'mt-1.5')}
                >
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <NumberField
              label="Passes that exist"
              value={ownCap}
              onChange={setOwnCap}
              help="The price and this number are fixed after the first sale. No more passes are ever created."
            />
            <div>
              <div className={segmented.trough} role="radiogroup" aria-label="How the price works">
                {([
                  [false, 'One price'],
                  [true, 'Price rises by tiers'],
                ] as const).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={ownTiered === value}
                    onClick={() => setOwnTiered(value)}
                    className={cx(segmented.chip, ownTiered === value ? segmented.chipActive : segmented.chipIdle)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {ownTiered && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Final price" value={ownFinalPrice} onChange={setOwnFinalPrice} help="The price above is the start price." />
                  <NumberField
                    label="Number of tiers"
                    value={ownTierCount}
                    onChange={setOwnTierCount}
                    help={`${MIN_PRICE_TIERS} to ${Math.max(MIN_PRICE_TIERS, maxTierCountFor(Math.floor(cap)))}, at least 10 passes each.`}
                  />
                </div>
                {ownGrid.error && <p className={cx(text.note, 'text-red-300')}>{ownGrid.error}</p>}
              </>
            )}
          </>
        )}
      </section>

      <section className={cx(surface.card, 'space-y-4 p-5')}>
        <h3 className={text.cardTitle}>Resales</h3>
        <p className={text.note}>
          A holder can resell a pass on BaseTube. You receive {pctText(royaltyPct)} of each resale.
        </p>
        <NumberField
          label="Passes resold in a year"
          value={resold}
          onChange={setResold}
          suffix="%"
          help="Out of the passes sold. Set 0 to leave resales out."
        />
        <NumberField
          label="Average resale price"
          value={resalePriceInput}
          onChange={setResalePriceInput}
          placeholder={price > 0 ? String(price) : undefined}
          help="Holders set their own price. Left empty, a resale is counted at the pass price."
        />
      </section>
    </div>
  );

  const results = (
    <div className="space-y-6">
      <section className={cx(surface.card, 'p-5')} aria-live="polite">
        <p className={text.label}>Your earnings from first sales</p>
        <p className={cx(text.hero, 'mt-2')}>{ready ? money(result.creatorEarns) : '—'}</p>
        <p className={cx(text.sub, 'mt-2')}>
          {ready
            ? `${passesText(result.sold)} sold out of ${formatCount(cap)}${result.soldOut ? ' — sold out' : ''}`
            : 'Set a price and a number of passes to see the figures.'}
        </p>

        {ready && (
          <div className={cx('mt-4 divide-y border-t', surface.hairline)}>
            <Line label="Buyers pay" value={money(result.buyersPay)} />
            <Line label={`You keep ${CREATOR_PRIMARY_PCT}%`} value={money(result.creatorEarns)} />
            <Line label={`Royalties in a year (${formatCount(result.resalesPerYear)} resales)`} value={money(result.royaltyPerYear)} />
            <Line label="First sales + one year of royalties" value={money(result.firstYearTotal)} strong />
          </div>
        )}
        <p className={cx(text.note, 'mt-3')}>
          Before the card fee: when a fan pays by card, the payment provider's fee comes out of your share.
        </p>
      </section>

      {ready && (
        <section className={cx(surface.card, 'p-5')}>
          <h3 className={text.cardTitle}>The same pass, three audiences</h3>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="pb-2 font-medium">Who buys</th>
                <th className="pb-2 text-right font-medium">Passes sold</th>
                <th className="pb-2 text-right font-medium">You earn</th>
              </tr>
            </thead>
            <tbody className={cx('divide-y', surface.hairline)}>
              {result.scenarios.map((row) => (
                <tr key={row.buyerSharePct}>
                  <td className="py-2 text-gray-300">{pctText(row.buyerSharePct)} of subscribers</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">
                    {formatCount(row.sold)}
                    {row.soldOut && <span className="ml-1.5 text-xs text-[#fa7517]">sold out</span>}
                  </td>
                  <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-white">{money(row.creatorEarns)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 text-gray-300">Every pass sold</td>
                <td className="py-2 text-right tabular-nums text-gray-200">{formatCount(cap)}</td>
                <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-white">{money(result.creatorEarnsIfSoldOut)}</td>
              </tr>
            </tbody>
          </table>
          {result.shareNeededToSellOutPct !== null && (
            <p className={cx(text.note, 'mt-3')}>
              To sell every pass, {pctText(Math.round(result.shareNeededToSellOutPct * 10) / 10)} of your subscribers have to buy one.
              {result.shareNeededToSellOutPct > 100 && ' That is more passes than subscribers: consider fewer passes.'}
            </p>
          )}
        </section>
      )}

      {ready && (
        <section className={cx(surface.card, 'p-5')}>
          <h3 className={text.cardTitle}>What you keep at several sales levels</h3>
          <table className="mt-3 w-full text-sm">
            <tbody className={cx('divide-y', surface.hairline)}>
              {result.levels.map((level) => (
                <tr key={level.pct}>
                  <td className="py-2 text-gray-300">
                    {level.pct === 100 ? 'All sold' : `${level.pct}% sold`} · {formatCount(level.sold)} passes
                  </td>
                  <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-white">{money(level.creatorEarns)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tiers && (
            <p className={cx(text.note, 'mt-3')}>Passes are counted cheapest first: a partial sale earns the early prices.</p>
          )}
        </section>
      )}

      <p className={text.note}>
        An estimate, not a promise. What you earn depends on how many fans actually buy and on what holders resell for.
      </p>
    </div>
  );

  if (layout === 'panel') {
    return (
      <div className="space-y-6">
        {results}
        {entries}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {entries}
      {results}
    </div>
  );
};

export default RevenueSimulator;
