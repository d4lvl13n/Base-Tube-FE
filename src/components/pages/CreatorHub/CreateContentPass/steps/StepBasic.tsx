import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, UseFormWatch, Controller } from 'react-hook-form';
import { DollarSign, Euro, PoundSterling, Users, Calculator } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types';
import { motion } from 'framer-motion';

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
  return <currencyData.symbol size={18} />;
};

const centsToDisplayValue = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return `${value / 100}`.replace(/\.0$/, '');
};

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
    <>
      <S.FormGroup>
        <S.Label htmlFor="title">Pass Title *</S.Label>
        <S.Input
          id="title"
          placeholder="E.g., Premium Video Masterclass"
          {...register('title', {
            required: 'Title is required'
          })}
        />
        {errors.title && (
          <S.ErrorText>{errors.title.message}</S.ErrorText>
        )}
        <S.InfoText>Choose a catchy title that describes your exclusive content.</S.InfoText>
      </S.FormGroup>

      <S.ThreeColumns>
        <S.FormGroup>
          <S.Label htmlFor="price">Price *</S.Label>
          <div className="relative">
            <Controller
              name="price_cents"
              control={control}
              rules={{
                required: 'Price is required',
                min: { value: 100, message: 'Minimum price is $1.00' },
                validate: value => (value !== undefined && value !== null && !isNaN(value)) || 'Please enter a valid price'
              }}
              render={({ field: { onChange, ref } }) => (
                <div className="flex items-center">
                  <S.PremiumInputPrefix>
                    {getCurrencySymbol(watchedFields.currency || 'USD')}
                  </S.PremiumInputPrefix>
                  <S.PremiumInput
                    id="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="5.00"
                    ref={ref}
                    value={priceInput}
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
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedPrices.map(price => (
              <button
                key={price}
                type="button"
                onClick={() => {
                  setPriceInput(price.toFixed(2));
                  setValue('price_cents', price * 100, { shouldValidate: true, shouldDirty: true });
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  activeSuggestedPrice === price
                    ? 'border-[#fa7517] bg-[#fa7517]/15 text-[#fa7517]'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white'
                }`}
              >
                {price.toFixed(0)}
              </button>
            ))}
          </div>
          {errors.price_cents && (
            <S.ErrorText>{errors.price_cents.message}</S.ErrorText>
          )}
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="currency">Currency *</S.Label>
          <S.CurrencySelect>
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Currency is required' }}
              render={({ field: { onChange, value, ref } }) => (
                <S.PremiumSelect
                  id="currency"
                  ref={ref}
                  value={value || 'USD'}
                  onChange={onChange}
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </S.PremiumSelect>
              )}
            />
          </S.CurrencySelect>
          {errors.currency && (
            <S.ErrorText>{errors.currency.message}</S.ErrorText>
          )}
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="supply_cap">Supply Cap *</S.Label>
          <div className="relative">
            <Controller
              name="supply_cap"
              control={control}
              rules={{
                required: 'Supply cap is required',
                validate: value => (Number.isInteger(value) && (value ?? 0) >= 1) || 'Supply cap must be a whole number greater than 0'
              }}
              render={({ field: { onChange, ref } }) => (
                <div className="flex items-center">
                  <S.PremiumInputPrefix>
                    <Users size={18} />
                  </S.PremiumInputPrefix>
                  <S.PremiumInput
                    id="supply_cap"
                    type="text"
                    inputMode="numeric"
                    placeholder="100"
                    ref={ref}
                    value={supplyCapInput}
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
          </div>
          {errors.supply_cap && (
            <S.ErrorText>{errors.supply_cap.message}</S.ErrorText>
          )}
          <S.InfoText>Whole numbers only. This controls how many passes can ever be sold.</S.InfoText>
        </S.FormGroup>
      </S.ThreeColumns>

      <S.InfoText>
        Set a competitive price and a realistic supply cap to maximize your earnings. Limited availability creates scarcity and can increase purchase urgency.
      </S.InfoText>

      <div className="mt-4 rounded-lg border border-gray-800/30 bg-black/50 p-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h4 className="text-lg font-medium text-white">Not sure about pricing?</h4>
            <p className="text-sm text-gray-400">Use our revenue simulator to compare price points and supply options before you launch.</p>
          </div>
          <motion.a
            href="/creator-hub/nft-simulator"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-700"
          >
            <Calculator className="h-4 w-4" />
            Open Revenue Simulator
          </motion.a>
        </div>
      </div>
    </>
  );
};

export default StepBasic;
