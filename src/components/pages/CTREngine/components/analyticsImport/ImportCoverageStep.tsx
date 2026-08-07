// Step (c) — the date range. MANDATORY, and deliberately un-skippable.
//
// "DATE RANGE IS MANDATORY USER CONFIRMATION (exact range or 'Lifetime' — no
// unlabeled ranges)" (v2.1 CSV parser rules, LOCKED). Everything downstream
// depends on it: an unlabeled window makes cross-window ratios possible, which
// is exactly the lie the multi-source design exists to prevent.
//
// Detection only PREFILLS the inputs. The user still has to pick.

import React from 'react';
import { ArrowRight, CalendarRange, Infinity as InfinityIcon, AlertCircle } from 'lucide-react';
import type {
  AnalyticsImportCoverage,
  AnalyticsImportDetectedCoverage,
} from '../../../../../types/ctr';

interface ImportCoverageStepProps {
  detected: AnalyticsImportDetectedCoverage | undefined;
  kind: 'date_range' | 'lifetime' | null;
  startDate: string;
  endDate: string;
  onChange: (next: {
    kind: 'date_range' | 'lifetime' | null;
    startDate: string;
    endDate: string;
  }) => void;
  onContinue: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export const coverageFromForm = (
  kind: 'date_range' | 'lifetime' | null,
  startDate: string,
  endDate: string
): AnalyticsImportCoverage | null => {
  if (kind === 'lifetime') return { kind: 'lifetime' };
  if (kind === 'date_range' && startDate && endDate && startDate <= endDate) {
    return { kind: 'date_range', startDate, endDate };
  }
  return null;
};

export const ImportCoverageStep: React.FC<ImportCoverageStepProps> = ({
  detected,
  kind,
  startDate,
  endDate,
  onChange,
  onContinue,
  isSubmitting,
  error,
}) => {
  const coverage = coverageFromForm(kind, startDate, endDate);
  const rangeInvalid =
    kind === 'date_range' && !!startDate && !!endDate && startDate > endDate;

  const inputClass =
    'min-h-[44px] w-[160px] max-w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-[#fa7517]/50 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/40';

  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-300">
        What window do these numbers cover? We store this with every value and print it on every
        card — nothing is ever compared across two different windows.
      </p>

      {detected && detected.kind !== 'unknown' && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
          Detected from your file
          {detected.source ? ` (${detected.source})` : ''} — please confirm it is right.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {/* Exact range */}
        <label
          className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
            kind === 'date_range'
              ? 'border-[#fa7517]/40 bg-[#fa7517]/5'
              : 'border-gray-800/60 bg-black/40 hover:border-gray-700'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <input
              type="radio"
              name="coverage-kind"
              checked={kind === 'date_range'}
              onChange={() => onChange({ kind: 'date_range', startDate, endDate })}
              className="h-4 w-4 accent-[#fa7517]"
            />
            <CalendarRange className="h-4 w-4 text-[#fa7517]" />
            <span className="text-sm font-semibold text-white">An exact date range</span>
          </span>
          <span className="mt-1 block pl-[42px] text-xs text-gray-500">
            The normal case — a Studio export for a fixed window, e.g. the last 28 days.
          </span>

          {kind === 'date_range' && (
            <span className="mt-3 flex flex-wrap items-center gap-3 pl-[42px]">
              <span className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    onChange({ kind: 'date_range', startDate: e.target.value, endDate })
                  }
                  className={inputClass}
                />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) =>
                    onChange({ kind: 'date_range', startDate, endDate: e.target.value })
                  }
                  className={inputClass}
                />
              </span>
            </span>
          )}
        </label>

        {/* Lifetime */}
        <label
          className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
            kind === 'lifetime'
              ? 'border-[#fa7517]/40 bg-[#fa7517]/5'
              : 'border-gray-800/60 bg-black/40 hover:border-gray-700'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <input
              type="radio"
              name="coverage-kind"
              checked={kind === 'lifetime'}
              onChange={() => onChange({ kind: 'lifetime', startDate, endDate })}
              className="h-4 w-4 accent-[#fa7517]"
            />
            <InfinityIcon className="h-4 w-4 text-[#fa7517]" />
            <span className="text-sm font-semibold text-white">Lifetime totals</span>
          </span>
          <span className="mt-1 block pl-[42px] text-xs text-gray-500">
            Since each video was published. These never merge with a dated window, and never
            upgrade a 28-day report.
          </span>
        </label>
      </div>

      {rangeInvalid && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          The start date has to come before the end date.
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!coverage || isSubmitting}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Checking your rows…' : 'Confirm range'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ImportCoverageStep;
