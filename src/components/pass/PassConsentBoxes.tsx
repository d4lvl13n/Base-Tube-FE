import React from 'react';
import {
  CREATOR_PASS_TERMS_PATH,
  PASS_BUYER_DISCLOSURE_TEXT,
  PASS_TERMS_OF_SALE_PATH,
  PASSES_PRIVACY_ANCHOR,
  TERMS_TEXT,
  WITHDRAWAL_TEXT,
  creatorContactConsentText,
  type SaleConsentPublic,
} from '../../constants/passConsent';

interface PassConsentBoxesProps {
  consent?: SaleConsentPublic;
  acceptedTerms: boolean;
  acceptedWithdrawal: boolean;
  onAcceptedTerms: (value: boolean) => void;
  onAcceptedWithdrawal: (value: boolean) => void;
  /** Optional, unticked by default: the creator may email the buyer about new releases. */
  creatorContact: boolean;
  onCreatorContact: (value: boolean) => void;
  creatorName?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
}

const LINK_CLASS = 'underline underline-offset-2 text-[#f0f0f0] hover:text-white';

/**
 * Turns the named phrases of a server-provided sentence into links, leaving the
 * sentence itself unchanged (its exact text is hashed into the purchase record).
 */
function withLinks(text: string, links: Array<{ phrase: string; href: string }>): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest) {
    let next: { index: number; phrase: string; href: string } | null = null;
    for (const link of links) {
      const index = rest.indexOf(link.phrase);
      if (index >= 0 && (!next || index < next.index)) next = { index, ...link };
    }
    if (!next) {
      parts.push(rest);
      break;
    }
    if (next.index > 0) parts.push(rest.slice(0, next.index));
    parts.push(
      <a key={key++} href={next.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {next.phrase}
      </a>
    );
    rest = rest.slice(next.index + next.phrase.length);
  }
  return parts;
}

/**
 * Always visible near the Buy buttons: what the creator will see about a buyer.
 * Not a checkbox — it informs, it does not ask.
 */
export const PassBuyerDisclosure: React.FC = () => (
  <p className="text-xs leading-relaxed text-[#a1a4a5]">
    {PASS_BUYER_DISCLOSURE_TEXT}{' '}
    <a href={PASSES_PRIVACY_ANCHOR} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      What creators see
    </a>
  </p>
);

/**
 * The two required checkout boxes (same sentences on card and crypto), then
 * the optional creator-contact box.
 */
const PassConsentBoxes: React.FC<PassConsentBoxesProps> = ({
  consent,
  acceptedTerms,
  acceptedWithdrawal,
  onAcceptedTerms,
  onAcceptedWithdrawal,
  creatorContact,
  onCreatorContact,
  creatorName,
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
        <span>
          {withLinks(terms, [
            { phrase: 'Terms of Sale', href: PASS_TERMS_OF_SALE_PATH },
            { phrase: 'Creator Pass Terms', href: CREATOR_PASS_TERMS_PATH },
          ])}
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#c8c8c8]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
          checked={acceptedWithdrawal}
          disabled={disabled}
          onChange={(event) => onAcceptedWithdrawal(event.target.checked)}
        />
        <span>
          {withLinks(withdrawal, [
            { phrase: '14-day right of withdrawal', href: `${PASS_TERMS_OF_SALE_PATH}#withdrawal` },
          ])}
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#a1a4a5]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
          checked={creatorContact}
          disabled={disabled}
          onChange={(event) => onCreatorContact(event.target.checked)}
        />
        <span>{creatorContactConsentText(creatorName)}</span>
      </label>
    </div>
  );
};

export default PassConsentBoxes;
