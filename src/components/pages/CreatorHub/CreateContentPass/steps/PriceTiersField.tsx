// The "Price rises by tiers" half of the wizard's Price card: the builder
// (start price — typed in the price field above — final price, number of
// tiers), the grid it makes, editable row by row, and the four things the
// creator should know before choosing a grid (base-be
// PASS_TIERED_PRICING_SPEC.md §7.4). Rules and words: utils/passPricing.
import React, { useEffect, useId, useState } from 'react';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cx, surface, text } from '../../Business/businessStyles';
import { formatMinor } from '../../Business/businessFormat';
import { CREATOR_PRIMARY_PCT } from '../../RevenueSimulator/revenueModel';
import { resaleTermsOf } from '../../../../../utils/passTerms';
import {
  DEFAULT_TIER_COUNT,
  MIN_PRICE_TIERS,
  buildTiers,
  climbStatement,
  firstPriceReach,
  maxTierCountFor,
  resaleAndTiersStatement,
  revenueLevels,
  validateTiers,
  type PriceTierDto,
} from '../../../../../utils/passPricing';
import { FormData } from '../types';
import { FieldError, FieldHelp, FieldLabel, PresetChips, describedBy, wizardInput, wizardInputInvalid } from '../wizardUi';

interface PriceTiersFieldProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
}

const centsToText = (cents?: number | null): string =>
  cents === undefined || cents === null || Number.isNaN(cents) ? '' : `${cents / 100}`.replace(/\.0$/, '');

/** A money box in the currency's main unit (10.50), holding minor units. */
const MoneyInput: React.FC<{
  id: string;
  value: number | undefined;
  onChange: (cents: number | undefined) => void;
  invalid?: boolean;
  ariaLabel?: string;
  describedById?: string;
  className?: string;
}> = ({ id, value, onChange, invalid, ariaLabel, describedById, className }) => {
  const [raw, setRaw] = useState(() => centsToText(value));
  // Follow values set from elsewhere (the builder, a resumed draft) unless they already match what is typed.
  useEffect(() => {
    setRaw((current) => (Math.round(Number(current.replace(',', '.')) * 100) === value ? current : centsToText(value)));
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedById}
      value={raw}
      className={cx(wizardInput, 'tabular-nums', invalid && wizardInputInvalid, className)}
      onChange={(event) => {
        const next = event.target.value.replace(',', '.');
        if (next !== '' && !/^\d*\.?\d{0,2}$/.test(next)) return;
        setRaw(next);
        onChange(next === '' || Number.isNaN(Number(next)) ? undefined : Math.round(Number(next) * 100));
      }}
    />
  );
};

const PriceTiersField: React.FC<PriceTiersFieldProps> = ({ control, errors, watch, setValue }) => {
  const uid = useId();
  const [startCents, finalCents, count, cap, tiers, maxPerBuyer, currency] = watch([
    'price_cents',
    'final_price_cents',
    'tier_count',
    'supply_cap',
    'price_tiers',
    'max_per_buyer',
    'currency',
  ]);
  const code = currency || 'EUR';
  const maxCount = maxTierCountFor(cap);
  const counts = Array.from({ length: Math.max(0, maxCount - MIN_PRICE_TIERS + 1) }, (_, i) => i + MIN_PRICE_TIERS);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // The builder runs whenever one of its entries changes; editing a row of
  // the grid afterwards keeps the edit until an entry changes again.
  useEffect(() => {
    const out = buildTiers({ supplyCap: cap, startPriceCents: startCents, finalPriceCents: finalCents, count: count ?? DEFAULT_TIER_COUNT });
    if ('error' in out) {
      setBuilderError(finalCents === undefined ? null : out.error);
      return;
    }
    setBuilderError(null);
    setValue('price_tiers', out.tiers, { shouldValidate: true, shouldDirty: true });
  }, [startCents, finalCents, count, cap, setValue]);

  const grid = Array.isArray(tiers) ? tiers : [];
  const gridValid = grid.length >= MIN_PRICE_TIERS && validateTiers(grid, cap) === true;
  const climb = gridValid ? climbStatement(grid) : null;
  const reach = gridValid ? firstPriceReach(grid, maxPerBuyer, code) : null;
  const levels = gridValid ? revenueLevels(grid) : [];
  const money = (cents: number) => formatMinor(cents, code, 2);
  const totalInGrid = grid.reduce((sum, t) => sum + (Number.isFinite(t.size) ? t.size : 0), 0);

  const editRow = (index: number, patch: Partial<PriceTierDto>) => {
    const next = grid.map((tier, i) => (i === index ? { ...tier, ...patch } : tier));
    setValue('price_tiers', next, { shouldValidate: true, shouldDirty: true });
  };

  const gridError = (errors.price_tiers as { message?: string } | undefined)?.message;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-final`}>Final price</FieldLabel>
          <Controller
            name="final_price_cents"
            control={control}
            rules={{
              // Read from the form values, not this render: the rule can outlive a mode switch.
              validate: (value, values) =>
                values.pricing_mode !== 'tiered' ||
                (value !== undefined && values.price_cents !== undefined && value > values.price_cents) ||
                'The final price must be higher than the start price.',
            }}
            render={({ field: { value, onChange } }) => (
              <MoneyInput
                id={`${uid}-final`}
                value={value}
                onChange={onChange}
                invalid={Boolean(errors.final_price_cents)}
                describedById={describedBy(`${uid}-final-help`, errors.final_price_cents && `${uid}-final-error`)}
              />
            )}
          />
          <FieldError id={`${uid}-final-error`}>{errors.final_price_cents?.message}</FieldError>
          <FieldHelp id={`${uid}-final-help`}>What the last passes cost. The start price is the price above.</FieldHelp>
        </div>
        <div>
          <FieldLabel id={`${uid}-count-label`} hint={maxCount >= MIN_PRICE_TIERS ? `2 to ${maxCount}` : undefined}>
            Number of tiers
          </FieldLabel>
          {counts.length > 0 ? (
            <PresetChips
              label="Number of tiers"
              options={counts}
              value={count ?? DEFAULT_TIER_COUNT}
              onSelect={(n) => setValue('tier_count', n, { shouldDirty: true })}
            />
          ) : (
            <p className={text.note}>Set at least 20 passes to use tiers.</p>
          )}
          <FieldHelp>Each tier holds at least 10 passes.</FieldHelp>
        </div>
      </div>

      {builderError && (
        <p className="flex items-start gap-1.5 text-xs text-red-300" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{builderError}</span>
        </p>
      )}

      {/* The grid: one row per tier, every number editable. */}
      <Controller
        name="price_tiers"
        control={control}
        rules={{ validate: (value, values) => values.pricing_mode !== 'tiered' || validateTiers(value ?? [], values.supply_cap) }}
        render={() => <></>}
      />
      {grid.length > 0 && (
        <div className={cx(surface.inset, 'overflow-hidden')}>
          <table className="w-full text-sm">
            <caption className="sr-only">Price grid</caption>
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th scope="col" className="px-4 py-2 font-medium">Tier</th>
                <th scope="col" className="px-4 py-2 font-medium">Passes</th>
                <th scope="col" className="px-4 py-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody className={cx('divide-y', surface.hairline)}>
              {grid.map((tier, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 tabular-nums text-gray-300">{i + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Tier ${i + 1}: number of passes`}
                      value={Number.isFinite(tier.size) ? String(tier.size) : ''}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '').slice(0, 6);
                        editRow(i, { size: digits === '' ? NaN : Number.parseInt(digits, 10) });
                      }}
                      className={cx(wizardInput, 'w-24 tabular-nums')}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <MoneyInput
                      id={`${uid}-tier-${i}`}
                      ariaLabel={`Tier ${i + 1}: price`}
                      value={tier.priceCents}
                      onChange={(cents) => editRow(i, { priceCents: cents ?? NaN })}
                      className="w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={cx(text.note, 'px-4 py-2')}>
            {totalInGrid.toLocaleString('en-US')} of {(cap ?? 0).toLocaleString('en-US')} passes in the grid.
          </p>
        </div>
      )}
      <FieldError>{gridError}</FieldError>

      {/* What the creator should know before choosing this grid. */}
      {gridValid && climb && reach && (
        <div className="space-y-3">
          <ul className="space-y-2 text-sm leading-relaxed text-gray-300">
            <li>
              {climb.text}
              {climb.warning && <span className="block text-gray-400">{climb.warning}</span>}
            </li>
            <li>
              {reach.text}
              {reach.wholeTier && (
                <span className="block text-gray-400">
                  {reach.wholeTier}{' '}
                  {reach.suggestedLimit && (
                    <button
                      type="button"
                      className={cx(text.link, 'font-medium')}
                      onClick={() => setValue('max_per_buyer', reach.suggestedLimit as number, { shouldValidate: true, shouldDirty: true })}
                    >
                      Set the limit to {reach.suggestedLimit} per person
                    </button>
                  )}
                </span>
              )}
            </li>
            <li>{resaleAndTiersStatement(resaleTermsOf(null).creatorPct, CREATOR_PRIMARY_PCT)}</li>
          </ul>

          <div className={cx(surface.inset, 'px-4 py-3')}>
            <p className={text.label}>What you keep at several sales levels ({CREATOR_PRIMARY_PCT}%, before the card fee)</p>
            <table className="mt-2 w-full text-sm">
              <tbody className={cx('divide-y', surface.hairline)}>
                {levels.map((level) => (
                  <tr key={level.pct}>
                    <td className="py-1.5 text-gray-300">
                      {level.pct === 100 ? 'All sold' : `${level.pct}% sold`} · {level.units.toLocaleString('en-US')} passes
                    </td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-white">
                      {money(Math.round((level.buyersPayCents * CREATOR_PRIMARY_PCT) / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className={text.note}>Fans who buy early pay less. Every pass gives the same access to the same videos.</p>
    </div>
  );
};

export default PriceTiersField;
