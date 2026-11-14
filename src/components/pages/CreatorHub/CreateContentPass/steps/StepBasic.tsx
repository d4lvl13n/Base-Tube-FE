import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, UseFormWatch, Controller } from 'react-hook-form';
import { DollarSign, Euro, PoundSterling, Users, UserRound, Calculator, Lock } from 'lucide-react';
import { cx, segmented, text } from '../../Business/businessStyles';
import { FormData } from '../types';
import {
  MAX_PER_BUYER_HELP,
  SUPPLY_CAP_BOUNDS,
  SUPPLY_CAP_HELP,
  SUPPLY_CAP_PRESETS,
  validateMaxPerBuyer,
  validateSupplyCap,
} from '../../../../../utils/passTerms';
import {
  FieldError,
  FieldHelp,
  FieldLabel,
  PresetChips,
  WizardCard,
  describedBy,
  wizardInput,
  wizardInputInvalid,
} from '../wizardUi';

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

const suggestedPrices = [5, 10, 25, 50] as const;

const getCurrencySymbol = (currency: string | undefined) => {
  const currencyData = currencies.find(c => c.code === currency) || currencies[0];
  return <currencyData.symbol className="h-4 w-4" aria-hidden="true" />;
};

const centsToDisplayValue = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return `${value / 100}`.replace(/\.0$/, '');
};

const intToDisplayValue = (value?: number) =>
  value === undefined || value === null || Number.isNaN(value) ? '' : String(value);

/** `wizardInput` with room for a leading icon. */
const prefixedInput = cx(wizardInput, 'pl-9');
const leadingIcon = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500';

const StepBasic = ({ register, errors, watch, setValue, control }: StepBasicProps): JSX.Element => {
  const watchedFields = watch();
  const [priceInput, setPriceInput] = useState(() => centsToDisplayValue(watchedFields.price_cents));
  const [supplyCapInput, setSupplyCapInput] = useState(() => intToDisplayValue(watchedFields.supply_cap));
  const [perBuyerInput, setPerBuyerInput] = useState(() => intToDisplayValue(watchedFields.max_per_buyer));
  const titleLength = (watchedFields.title || '').length;
  const cap = watchedFields.supply_cap;
  const activeSuggestedPrice = watchedFields.price_cents !== undefined
    ? suggestedPrices.find(price => price * 100 === watchedFields.price_cents)
    : undefined;

  useEffect(() => {
    if (watchedFields.price_cents === undefined || watchedFields.price_cents === null || Number.isNaN(watchedFields.price_cents)) {
      setPriceInput('');
    }
  }, [watchedFields.price_cents]);

  // Keep the two number boxes in step with values set from elsewhere (presets, a resumed draft, a reset).
  useEffect(() => {
    setSupplyCapInput(intToDisplayValue(watchedFields.supply_cap));
  }, [watchedFields.supply_cap]);

  useEffect(() => {
    setPerBuyerInput(intToDisplayValue(watchedFields.max_per_buyer));
  }, [watchedFields.max_per_buyer]);

  /** A new number of passes: the per-person limit can never be above it. */
  const applyCap = (next: number | undefined) => {
    setValue('supply_cap', next, { shouldValidate: true, shouldDirty: true });
    const perBuyer = watchedFields.max_per_buyer;
    if (next !== undefined && Number.isInteger(next) && next >= 1 && perBuyer !== undefined && perBuyer > next) {
      setValue('max_per_buyer', next, { shouldValidate: true, shouldDirty: true });
    } else if (perBuyer !== undefined) {
      setValue('max_per_buyer', perBuyer, { shouldValidate: true });
    }
  };

  const capValid = typeof cap === 'number' && Number.isInteger(cap) && cap >= 1;

  return (
    <div className="space-y-5">
      {/* ── Title ──────────────────────────────────────────────────────── */}
      <WizardCard id="basic-name" title="Name your pass" description="Buyers see this name on the sales page and in their passes.">
        <FieldLabel htmlFor="title" hint={`${titleLength}/120`}>
          Pass title
        </FieldLabel>
        <input
          id="title"
          type="text"
          placeholder="E.g., Premium Video Masterclass"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={describedBy('title-help', errors.title && 'title-error')}
          className={cx(wizardInput, errors.title && wizardInputInvalid)}
          maxLength={120}
          {...register('title', {
            required: 'Title is required',
            maxLength: { value: 120, message: 'Title must be 120 characters or fewer' },
          })}
        />
        <FieldError id="title-error">{errors.title?.message}</FieldError>
        <FieldHelp id="title-help">Choose a clear title that says what the videos are about. You can fix a typo later.</FieldHelp>
      </WizardCard>

      {/* ── Price ──────────────────────────────────────────────────────── */}
      <WizardCard
        id="basic-price"
        title="Price"
        description="What one pass costs at the first sale. It never changes after someone buys."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <FieldLabel htmlFor="price">Price per pass</FieldLabel>
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
                    aria-describedby={describedBy('price-help', errors.price_cents && 'price-error')}
                    className={cx(prefixedInput, 'tabular-nums', errors.price_cents && wizardInputInvalid)}
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
            <FieldError id="price-error">{errors.price_cents?.message}</FieldError>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-400">Suggested</span>
              <PresetChips
                label="Suggested prices"
                options={suggestedPrices}
                value={activeSuggestedPrice}
                onSelect={(price) => {
                  setPriceInput(price.toFixed(2));
                  setValue('price_cents', price * 100, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <FieldHelp id="price-help">At least 1.00.</FieldHelp>
          </div>

          {/* Currency */}
          <div>
            <FieldLabel id="currency-label">Currency</FieldLabel>
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Currency is required' }}
              render={({ field: { onChange, value, ref } }) => (
                <div
                  id="currency"
                  className={cx(segmented.trough, 'h-10')}
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
            <FieldError>{errors.currency?.message}</FieldError>
          </div>
        </div>
      </WizardCard>

      {/* ── How many passes exist, and how many one person may buy ─────── */}
      <WizardCard
        id="basic-limits"
        title="How many passes exist"
        description={SUPPLY_CAP_HELP}
      >
        <div className="space-y-6">
          <div>
            <FieldLabel htmlFor="supply_cap">Number of passes</FieldLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <PresetChips
                label="Common numbers of passes"
                options={SUPPLY_CAP_PRESETS}
                value={cap}
                onSelect={(n) => applyCap(n)}
                format={(n) => n.toLocaleString('en-US')}
              />
              <span className="hidden text-xs text-gray-500 sm:inline" aria-hidden="true">or</span>
              <Controller
                name="supply_cap"
                control={control}
                rules={{ validate: (value) => validateSupplyCap(value) }}
                render={({ field: { ref } }) => (
                  <div className="relative sm:w-44">
                    <Users className={leadingIcon} aria-hidden="true" />
                    <input
                      id="supply_cap"
                      type="text"
                      inputMode="numeric"
                      placeholder="Custom"
                      ref={ref}
                      value={supplyCapInput}
                      aria-invalid={errors.supply_cap ? true : undefined}
                      aria-describedby={describedBy('supply-cap-help', errors.supply_cap && 'supply-cap-error')}
                      className={cx(prefixedInput, 'tabular-nums', errors.supply_cap && wizardInputInvalid)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 7);
                        setSupplyCapInput(digitsOnly);
                        applyCap(digitsOnly === '' ? undefined : Number.parseInt(digitsOnly, 10));
                      }}
                    />
                  </div>
                )}
              />
            </div>
            <FieldError id="supply-cap-error">{errors.supply_cap?.message}</FieldError>
            <FieldHelp id="supply-cap-help">
              A whole number from {SUPPLY_CAP_BOUNDS.min.toLocaleString('en-US')} to {SUPPLY_CAP_BOUNDS.max.toLocaleString('en-US')}.
              It is fixed once the pass is published.
            </FieldHelp>
          </div>

          <div className="border-t border-gray-800/50 pt-5">
            <FieldLabel htmlFor="max_per_buyer" hint={capValid ? `1 to ${cap!.toLocaleString('en-US')}` : undefined}>
              Most passes one person can buy
            </FieldLabel>
            <Controller
              name="max_per_buyer"
              control={control}
              rules={{ validate: (value) => validateMaxPerBuyer(value, watchedFields.supply_cap) }}
              render={({ field: { ref, onChange } }) => (
                <div className="relative sm:w-44">
                  <UserRound className={leadingIcon} aria-hidden="true" />
                  <input
                    id="max_per_buyer"
                    type="text"
                    inputMode="numeric"
                    placeholder="10"
                    ref={ref}
                    value={perBuyerInput}
                    aria-invalid={errors.max_per_buyer ? true : undefined}
                    aria-describedby={describedBy('max-per-buyer-help', errors.max_per_buyer && 'max-per-buyer-error')}
                    className={cx(prefixedInput, 'tabular-nums', errors.max_per_buyer && wizardInputInvalid)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setPerBuyerInput(digitsOnly);
                      onChange(digitsOnly === '' ? undefined : Number.parseInt(digitsOnly, 10));
                    }}
                  />
                </div>
              )}
            />
            <FieldError id="max-per-buyer-error">{errors.max_per_buyer?.message}</FieldError>
            <FieldHelp id="max-per-buyer-help">{MAX_PER_BUYER_HELP}</FieldHelp>
          </div>
        </div>
      </WizardCard>

      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-400">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          The price, the number of passes and the per-person limit are part of what you promise buyers. You check them before
          saving; they cannot change after the first sale.
        </p>
        <a
          href="/creator-hub/nft-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className={cx(text.link, 'inline-flex shrink-0 items-center gap-1.5 text-xs font-medium')}
        >
          <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
          Open revenue simulator
        </a>
      </div>
    </div>
  );
};

export default StepBasic;
