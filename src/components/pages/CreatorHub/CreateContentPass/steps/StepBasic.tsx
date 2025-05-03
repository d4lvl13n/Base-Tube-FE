import React from 'react';
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, UseFormWatch, UseFormGetValues } from 'react-hook-form';
import { DollarSign, Euro, PoundSterling, Users, Calculator } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';

interface StepBasicProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
  getValues: UseFormGetValues<FormData>;
}

const tiers = [
  { id: 'bronze', name: 'Bronze', description: 'Basic tier for standard content' },
  { id: 'silver', name: 'Silver', description: 'Premium tier with enhanced value' },
  { id: 'gold', name: 'Gold', description: 'Exclusive tier for your best content' }
];

// Currency data with symbols and descriptions
const currencies = [
  { code: 'USD', name: 'United States Dollar', symbol: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: Euro },
  { code: 'GBP', name: 'British Pound', symbol: PoundSterling },
];

// Helper to get currency symbol component
const getCurrencySymbol = (currency: string | undefined) => {
  const currencyData = currencies.find(c => c.code === currency) || currencies[0];
  return <currencyData.symbol size={18} />;
};

const StepBasic = ({ register, errors, watch, setValue, control, getValues }: StepBasicProps): JSX.Element => {
  const watchedFields = watch();

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
      
      <S.FormGroup>
        <S.Label>Select Tier *</S.Label>
        <S.OptionGroup>
          {tiers.map(tier => {
            const isSelected = watchedFields.tier === tier.id;
            return (
              <S.TierOption
                key={tier.id}
                type="button"
                selected={isSelected}
                onClick={() => setValue('tier', tier.id, { shouldValidate: true })}
              >
                <S.TierBadge tier={tier.id}>{tier.name}</S.TierBadge>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#fa7517]/20' : 'bg-gray-700/50'}`}>
                  <span className={`font-bold text-lg ${isSelected ? 'text-[#fa7517]' : 'text-gray-400'}`}>{tier.name[0]}</span>
                </div>
                <p className="text-sm">{tier.description}</p>
              </S.TierOption>
            );
          })}
        </S.OptionGroup>
        <input type="hidden" {...register('tier', { required: 'Tier selection is required' })} />
        {errors.tier && (
          <S.ErrorText>{errors.tier.message}</S.ErrorText>
        )}
      </S.FormGroup>
      
      {/* Three equal columns for price, currency, and supply cap */}
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
              render={({ field: { onChange, value, ref } }) => (
                <div className="flex items-center">
                  <S.PremiumInputPrefix>
                    {getCurrencySymbol(watchedFields.currency || 'USD')}
                  </S.PremiumInputPrefix>
                  <S.PremiumInput
                    id="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="5"
                    ref={ref}
                    value={value === undefined || value === null || isNaN(value) ? '' : (value / 100).toFixed(2)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const displayValue = e.target.value;
                      // Allow empty input or valid number format with up to 2 decimal places
                      if (displayValue === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(displayValue)) {
                        const parsedValue = parseFloat(displayValue);
                        if (!isNaN(parsedValue)) {
                          // Update the cents value
                          onChange(Math.round(parsedValue * 100));
                        } else if (displayValue === '') {
                          // Handle empty case
                          onChange(undefined);
                        }
                      }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      // Format on blur to always ensure decimal format
                      const currentCents = getValues('price_cents');
                      if (typeof currentCents === 'number' && !isNaN(currentCents)) {
                        e.target.value = (currentCents / 100).toFixed(2);
                      }
                    }}
                  />
                </div>
              )}
            />
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
            <S.PremiumInputPrefix>
              <Users size={18} />
            </S.PremiumInputPrefix>
            <S.PremiumInput
              id="supply_cap"
              type="number"
              placeholder=""
              min="1"
              {...register('supply_cap', {
                required: 'Supply cap is required',
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: 'Supply cap must be at least 1'
                }
              })}
            />
          </div>
          {errors.supply_cap && (
            <S.ErrorText>{errors.supply_cap.message}</S.ErrorText>
          )}
        </S.FormGroup>
      </S.ThreeColumns>
      
      <S.InfoText>
        Set a competitive price and supply cap to maximize your earnings. Limited availability creates scarcity and can increase purchase urgency.
      </S.InfoText>
      
      {/* Revenue Simulator Link */}
      <div className="mt-4 p-4 bg-black/50 rounded-lg border border-gray-800/30 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h4 className="font-medium text-white text-lg">Not sure about pricing?</h4>
          <p className="text-gray-400 text-sm">Use our revenue simulator to find the optimal price point and supply cap</p>
        </div>
        <motion.a 
          href="/creator-hub/nft-simulator" 
          target="_blank" 
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
            rounded-lg text-sm font-medium text-white transition-all"
        >
          <Calculator className="w-4 h-4" />
          Open Revenue Simulator
        </motion.a>
      </div>
    </>
  );
};

export default StepBasic;
