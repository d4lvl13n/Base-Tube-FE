import React from 'react';
import { TERMS_TEXT, WITHDRAWAL_TEXT, type SaleConsentPublic } from '../../constants/passConsent';

interface PassConsentBoxesProps {
  consent?: SaleConsentPublic;
  acceptedTerms: boolean;
  acceptedWithdrawal: boolean;
  onAcceptedTerms: (value: boolean) => void;
  onAcceptedWithdrawal: (value: boolean) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * The two checkout boxes. Same sentences on card and crypto.
 */
const PassConsentBoxes: React.FC<PassConsentBoxesProps> = ({
  consent,
  acceptedTerms,
  acceptedWithdrawal,
  onAcceptedTerms,
  onAcceptedWithdrawal,
  disabled,
  autoFocus,
}) => {
  const terms = consent?.terms_text ?? TERMS_TEXT;
  const withdrawal = consent?.withdrawal_text ?? WITHDRAWAL_TEXT;

  return (
    <div className="flex flex-col gap-3 text-left">
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#c8c8c8]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
          checked={acceptedTerms}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event) => onAcceptedTerms(event.target.checked)}
        />
        <span>{terms}</span>
      </label>
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#c8c8c8]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
          checked={acceptedWithdrawal}
          disabled={disabled}
          onChange={(event) => onAcceptedWithdrawal(event.target.checked)}
        />
        <span>{withdrawal}</span>
      </label>
    </div>
  );
};

export default PassConsentBoxes;
