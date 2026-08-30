// src/components/pages/CreatorHub/ManagePasses/StripeConnectStrip.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStartStripeConnect, useStripeConnectStatus } from '../../../../hooks/usePass';
import { cx, form } from '../shared/hubStyles';

/**
 * Card sales on a fiat pass pay the creator through a Stripe (test) Connect
 * account; without one, "Buy with card" answers CONNECT_ACCOUNT_NOT_READY.
 * Crypto checkout does not need it.
 *
 * A quiet strip, not a second call to action: "Create pass" stays the only
 * orange thing on the page. Stripe sends the creator back to
 * `/creator-hub/passes?stripe=return|refresh`; that query is the cue to
 * re-read the status so the strip disappears the moment `ready` is true.
 *
 * The creator picks the account's COUNTRY before the first click. Stripe
 * fixes it at creation and the onboarding form is built around it, so a
 * guessed country leaves them on a form they cannot complete. While the
 * account is not live, "Change country" drops it and starts again.
 *
 * The status query failing must never block the page — the strip just
 * stays out of the way.
 */

/** Countries Stripe supports for Express accounts (mirrors the server allowlist). */
const COUNTRIES = [
  'AE', 'AT', 'AU', 'BE', 'BG', 'CA', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB',
  'GI', 'GR', 'HK', 'HR', 'HU', 'IE', 'IT', 'JP', 'LI', 'LT', 'LU', 'LV', 'MT', 'MX', 'NL', 'NO',
  'NZ', 'PL', 'PT', 'RO', 'SE', 'SG', 'SI', 'SK', 'TH', 'US',
];

/** The browser's region when it is one Stripe supports; otherwise the creator picks. */
function guessCountry(): string {
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return region && COUNTRIES.includes(region) ? region : '';
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The API answers `{ error: "<sentence>" }`; show it when it reads as one, else a generic line. */
function onboardingErrorText(error: unknown): string {
  const fromServer = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  if (typeof fromServer === 'string' && fromServer.trim().length > 12) return fromServer.trim();
  return 'Stripe could not be opened. Try again in a moment.';
}

const StripeConnectStrip: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: status, isError, refetch } = useStripeConnectStatus();
  const startConnect = useStartStripeConnect();
  const returned = searchParams.get('stripe');
  const handledReturn = useRef<string | null>(null);
  const [country, setCountry] = useState<string>(() => guessCountry());
  const [changingCountry, setChangingCountry] = useState(false);

  useEffect(() => {
    if (!returned || handledReturn.current === returned) return;
    handledReturn.current = returned;
    void refetch();
    // Drop `?stripe=…` so a reload does not re-trigger, and the URL is clean.
    const next = new URLSearchParams(searchParams);
    next.delete('stripe');
    setSearchParams(next, { replace: true });
  }, [returned, refetch, searchParams, setSearchParams]);

  const options = useMemo(
    () =>
      COUNTRIES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );

  if (isError || !status || status.ready) return null;

  const hasAccount = Boolean(status.accountId);
  const pickingCountry = !hasAccount || changingCountry;
  const canSubmit = !pickingCountry || country.length === 2;

  const submit = () => {
    if (pickingCountry) {
      startConnect.mutate({ country, restart: hasAccount });
    } else {
      startConnect.mutate({});
    }
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-gray-800/60 bg-white/[0.02] px-4 py-3 md:flex-row md:items-center md:justify-between"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-300">
          {hasAccount && !changingCountry
            ? `Your Stripe test account${status.country ? ` (${countryName(status.country)})` : ''} still needs details before card sales can pay you.`
            : 'Card sales that pay you in euros need a Stripe test account. Crypto checkout does not.'}
        </p>
        {startConnect.isError && (
          <p className={cx(form.errorText, 'mt-1')}>{onboardingErrorText(startConnect.error)}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {pickingCountry && (
          <label className="flex items-center gap-2">
            <span className={form.fieldLabel}>Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={cx(form.input, 'h-8 w-auto min-w-[11rem] pr-8')}
              aria-label="Country of your Stripe account"
            >
              <option value="">Choose…</option>
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasAccount && !changingCountry && (
          <button
            type="button"
            onClick={() => setChangingCountry(true)}
            className={form.ghostButton}
          >
            Change country
          </button>
        )}
        {changingCountry && (
          <button
            type="button"
            onClick={() => setChangingCountry(false)}
            className={form.ghostButton}
          >
            Keep current
          </button>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={startConnect.isPending || !canSubmit}
          className={cx(form.secondaryButton, 'shrink-0')}
        >
          {startConnect.isPending
            ? 'Opening Stripe…'
            : changingCountry
              ? 'Start over with this country'
              : hasAccount
                ? 'Continue onboarding'
                : 'Connect Stripe test account'}
        </button>
      </div>
    </div>
  );
};

export default StripeConnectStrip;
