// Step (d) — validation preview, then the success screen.
//
// The preview is what makes a self-reported import defensible: before the
// creator trusts a single card, they see how many rows actually matched a video,
// how many were thrown away, and what units we read the columns in. A silent
// import that dropped half the file would be worse than no import at all.
//
// The success screen ends on the only action that matters: re-run the audit, so
// the report comes back with the numbers attached.

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  CalendarRange,
  ArrowRight,
} from 'lucide-react';
import type { AnalyticsImportResult } from '../../../../../types/ctr';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatDay = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${MONTHS[m - 1]} ${d}`;
};

export const describeCoverage = (coverage: AnalyticsImportResult['coverage']): string =>
  coverage.kind === 'lifetime'
    ? 'Lifetime'
    : `${formatDay(coverage.startDate)} – ${formatDay(coverage.endDate)}`;

const UNIT_LABELS: Record<string, string> = {
  percentage_points: 'percentage points',
  seconds: 'seconds',
  count: 'whole numbers',
  ratio: 'a ratio',
};

interface ImportReviewStepProps {
  result: AnalyticsImportResult;
  /** True once the user has accepted the preview. */
  accepted: boolean;
  onAccept: () => void;
  onStartOver: () => void;
  onRerunAudit: () => void;
}

export const ImportReviewStep: React.FC<ImportReviewStepProps> = ({
  result,
  accepted,
  onAccept,
  onStartOver,
  onRerunAudit,
}) => {
  const rejected = result.rejectedRows ?? 0;
  const matched = result.matchedRows ?? 0;

  if (accepted) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h3 className="mt-3 text-lg font-bold text-white">Your export is in</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          {matched} videos now carry Reach, Hold and Conversion numbers, labelled{' '}
          <span className="text-amber-300">self-reported</span> and bounded by{' '}
          <span className="text-gray-200">{describeCoverage(result.coverage)}</span>. Re-run the
          audit to see them on the report.
        </p>
        <button
          type="button"
          onClick={onRerunAudit}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90"
        >
          <RefreshCw className="h-4 w-4" />
          Re-run the audit
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-300">
        Here is what we read out of your export. Nothing is shown on the report until you accept
        it.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-[160px] max-w-full flex-1 basis-[150px] rounded-xl border border-gray-800/60 bg-black/40 p-3">
          <p className="text-xl font-bold text-white">{matched}</p>
          <p className="mt-1 text-xs text-gray-500">rows matched a video</p>
        </div>
        <div
          className={`w-[160px] max-w-full flex-1 basis-[150px] rounded-xl border p-3 ${
            rejected > 0
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-gray-800/60 bg-black/40'
          }`}
        >
          <p className={`text-xl font-bold ${rejected > 0 ? 'text-amber-300' : 'text-white'}`}>
            {rejected}
          </p>
          <p className="mt-1 text-xs text-gray-500">rows skipped</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800/60 bg-black/40 px-2.5 py-1 text-[11px] text-gray-400">
          <CalendarRange className="h-3 w-3" />
          {describeCoverage(result.coverage)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300">
          <FileSpreadsheet className="h-3 w-3" />
          Self-reported
        </span>
      </div>

      {result.units && Object.keys(result.units).length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Units we read
          </p>
          <ul className="mt-2 space-y-1">
            {Object.entries(result.units).map(([field, unit]) => (
              <li key={field} className="text-xs text-gray-400">
                <span className="text-gray-300">{field}</span> — {UNIT_LABELS[unit] ?? unit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejected > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertCircle className="h-3.5 w-3.5" />
            Why rows were skipped
          </p>
          <ul className="mt-2 space-y-1">
            {(result.rejectionSamples && result.rejectionSamples.length > 0
              ? result.rejectionSamples
              : ['Rows without a resolvable video ID are never guessed at — they are dropped.']
            ).map((sample, i) => (
              <li key={i} className="text-xs text-gray-400">
                {sample}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={matched === 0}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirm import
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
        >
          Use a different file
        </button>
      </div>

      {matched === 0 && (
        <p className="mt-3 text-xs text-amber-300">
          No row matched a video, so there is nothing to import. Check that the export includes a
          video ID column.
        </p>
      )}
    </div>
  );
};

export default ImportReviewStep;
