import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, UseFormWatch, Controller } from 'react-hook-form';
import { DollarSign, Euro, PoundSterling, Users, Calculator } from 'lucide-react';
import { cx, form, page, segmented } from '../../shared/hubStyles';
import { FormData } from '../types';

interface StepBasicProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
}

const currencies = [
  { code: 'USD', name: 'United States Dollar', symbol: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: Euro },
  { code: 'GBP', name: 'British Pound', symbol: PoundSterling },
];

const suggestedPrices = [5, 10, 25, 50];

const getCurrencySymbol = (currency: string | undefined) => {
  const currencyData = currencies.find(c => c.code === currency) || currencies[0];
  return <currencyData.symbol className="h-4 w-4" aria-hidden="true" />;
};

const centsToDisplayValue = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return `${value / 100}`.replace(/\.0$/, '');
};

/** `form.input` with room for a leading icon. */
const prefixedInput = cx(form.input, 'pl-9');

const StepBasic = ({ register, errors, watch, setValue, control }: StepBasicProps): JSX.Element => {
  const watchedFields = watch();
  const [priceInput, setPriceInput] = useState(() => centsToDisplayValue(watchedFields.price_cents));
  const [supplyCapInput, setSupplyCapInput] = useState(() =>
    watchedFields.supply_cap === undefined || watchedFields.supply_cap === null || Number.isNaN(watchedFields.supply_cap)
      ? ''
      : String(watchedFields.supply_cap)
  );
  const activeSuggestedPrice = watchedFields.price_cents !== undefined
    ? suggestedPrices.find(price => price * 100 === watchedFields.price_cents)
    : undefined;

  useEffect(() => {
    if (watchedFields.price_cents === undefined || watchedFields.price_cents === null || Number.isNaN(watchedFields.price_cents)) {
      setPriceInput('');
    }
  }, [watchedFields.price_cents]);

  useEffect(() => {
    if (watchedFields.supply_cap === undefined || watchedFields.supply_cap === null || Number.isNaN(watchedFields.supply_cap)) {
      setSupplyCapInput('');
    }
  }, [watchedFields.supply_cap]);

  return (
    <div className="space-y-4">
      {/* ── Title ──────────────────────────────────────────────────────── */}
      <section className={cx(form.panel, 'space-y-1.5')} aria-labelledby="basic-title-label">
        <label id="basic-title-label" htmlFor="title" className={form.fieldLabel}>Pass title</label>
        <input
          id="title"
          type="text"
          placeholder="E.g., Premium Video Masterclass"
          aria-invalid={errors.title ? true : undefined}
          className={cx(form.input, errors.title && 'border-red-500/60')}
          maxLength={120}
          {...register('title', {
            required: 'Title is required',
            maxLength: { value: 120, message: 'Title must be 120 characters or fewer' },
          })}
        />
        {errors.title && (
          <p className={form.errorText}>{errors.title.message}</p>
        )}
        <p className={form.counter}>Choose a catchy title that describes your exclusive content.</p>
      </section>

      {/* ── Pricing & supply ───────────────────────────────────────────── */}
      <section className={cx(form.panel, 'space-y-5')} aria-label="Pricing and supply">
        <h2 className={form.panelTitle}>Pricing &amp; supply</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
          {/* Price */}
          <div className="space-y-1.5">
            <label htmlFor="price" className={form.fieldLabel}>Price</label>
            <Controller
              name="price_cents"
              control={control}
              rules={{
                required: 'Price is required',
                min: { value: 100, message: 'Minimum price is $1.00' },
                validate: value => (value !== undefined && value !== null && !isNaN(value)) || 'Please enter a valid price'
              }}
              render={({ field: { onChange, ref } }) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {getCurrencySymbol(watchedFields.currency || 'USD')}
                  </span>
                  <input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="5.00"
                    ref={ref}
                    value={priceInput}
                    aria-invalid={errors.price_cents ? true : undefined}
                    className={cx(prefixedInput, errors.price_cents && 'border-red-500/60')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const nextValue = e.target.value.replace(',', '.');

                      if (nextValue === '') {
                        setPriceInput('');
                        onChange(undefined);
                        return;
                      }

                      if (!/^\d*\.?\d{0,2}$/.test(nextValue)) {
                        return;
                      }

                      setPriceInput(nextValue);

                      const parsedValue = Number(nextValue);
                      if (Number.isNaN(parsedValue)) {
                        return;
                      }

                      onChange(Math.round(parsedValue * 100));
                    }}
                  />
                </div>
              )}
            />
            <div className="flex items-center gap-3 pt-1">
              <span className={page.eyebrow}>Suggested</span>
              <div className={segmented.trough} role="group" aria-label="Suggested prices">
                {suggestedPrices.map(price => {
                  const active = activeSuggestedPrice === price;
                  return (
                    <button
                      key={price}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setPriceInput(price.toFixed(2));
                        setValue('price_cents', price * 100, { shouldValidate: true, shouldDirty: true });
                      }}
                      className={cx(segmented.chip, 'tabular-nums', active ? segmented.chipActive : segmented.chipIdle)}
                    >
                      {price.toFixed(0)}
                    </button>
                  );
                })}
              </div>
            </div>
            {errors.price_cents && (
              <p className={form.errorText}>{errors.price_cents.message}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <span id="currency-label" className={form.fieldLabel}>Currency</span>
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Currency is required' }}
              render={({ field: { onChange, value, ref } }) => (
                <div
                  id="currency"
                  className={cx(segmented.trough, 'h-9')}
                  role="radiogroup"
                  aria-labelledby="currency-label"
                >
                  {currencies.map(currency => {
                    const active = (value || 'USD') === currency.code;
                    return (
                      <button
                        key={currency.code}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={currency.name}
                        ref={active ? ref : undefined}
                        onClick={() => onChange(currency.code)}
                        className={cx(segmented.chip, active ? segmented.chipActive : segmented.chipIdle)}
                      >
                        {currency.code}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.currency && (
              <p className={form.errorText}>{errors.currency.message}</p>
            )}
          </div>
        </div>

        {/* Supply cap */}
        <div className="space-y-1.5 md:max-w-xs">
          <label htmlFor="supply_cap" className={form.fieldLabel}>Supply cap</label>
          <Controller
            name="supply_cap"
            control={control}
            rules={{
              required: 'Supply cap is required',
              validate: value => (Number.isInteger(value) && (value ?? 0) >= 1) || 'Supply cap must be a whole number greater than 0'
            }}
            render={({ field: { onChange, ref } }) => (
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                  id="supply_cap"
                  type="text"
                  inputMode="numeric"
                  placeholder="100"
                  ref={ref}
                  value={supplyCapInput}
                  aria-invalid={errors.supply_cap ? true : undefined}
                  className={cx(prefixedInput, 'tabular-nums', errors.supply_cap && 'border-red-500/60')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setSupplyCapInput(digitsOnly);
                    if (digitsOnly === '') {
                      onChange(undefined);
                      return;
                    }

                    onChange(Number.parseInt(digitsOnly, 10));
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    if (!digitsOnly) {
                      setSupplyCapInput('');
                      onChange(undefined);
                      return;
                    }

                    const normalized = Math.max(1, Number.parseInt(digitsOnly, 10));
                    setSupplyCapInput(String(normalized));
                    onChange(normalized);
                  }}
                />
              </div>
            )}
          />
          {errors.supply_cap && (
            <p className={form.errorText}>{errors.supply_cap.message}</p>
          )}
          <p className={form.counter}>Whole numbers only. This controls how many passes can ever be sold.</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Set a competitive price and a realistic supply cap to maximize your earnings. Limited availability creates scarcity and can increase purchase urgency.
          </p>
          <a
            href="/creator-hub/nft-simulator"
            target="_blank"
            rel="noopener noreferrer"
            className={cx(form.inlineAction, 'shrink-0')}
          >
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            Open revenue simulator
          </a>
        </div>
      </section>
    </div>
  );
};

export default StepBasic;
