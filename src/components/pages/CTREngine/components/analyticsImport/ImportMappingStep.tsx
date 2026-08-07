// Step (b) — column mapping. Only shown when `needsMapping` is true.
//
// The parser suggests from an alias registry, but value shapes only ever
// SUGGEST (v2.1 parser rules, LOCKED): anything ambiguous lands here and the
// user decides. Getting this wrong silently would poison the numbers, so the
// screen shows the file's own headers with sample values next to each choice.
//
// Minimum to continue: a video ID column + at least one metric. Everything else
// is optional — a partial export is fine, it just yields fewer cards.

import React from 'react';
import { ArrowRight, AlertCircle, Columns3 } from 'lucide-react';
import type { AnalyticsImportDetectedColumn, AnalyticsImportField } from '../../../../../types/ctr';

/** Our canonical fields, in the order a creator thinks about them. */
export const IMPORT_FIELDS: {
  field: AnalyticsImportField;
  label: string;
  hint: string;
  required?: boolean;
}[] = [
  {
    field: 'videoId',
    label: 'Video ID',
    hint: 'The 11-character ID or the full video URL. Titles are never matched.',
    required: true,
  },
  { field: 'impressions', label: 'Impressions', hint: 'How often the thumbnail was shown.' },
  {
    field: 'ctrPercent',
    label: 'Impressions click-through rate',
    hint: 'Percentage points — 4,3% and 4.3% both read as 4.3.',
  },
  { field: 'views', label: 'Views', hint: 'Views inside the range you confirm next.' },
  {
    field: 'averageViewDurationSeconds',
    label: 'Average view duration',
    hint: 'Seconds or H:MM:SS.',
  },
  {
    field: 'averageViewPercentage',
    label: 'Average percentage viewed',
    hint: 'Percentage points.',
  },
  { field: 'subscribersGained', label: 'Subscribers gained', hint: 'Net new subscribers.' },
];

const METRIC_FIELDS = IMPORT_FIELDS.filter((f) => !f.required).map((f) => f.field);

/** header → our field. `undefined` = do not import this column. */
export type HeaderAssignments = Record<string, AnalyticsImportField | undefined>;

export const mappingIsUsable = (assignments: HeaderAssignments): boolean => {
  const assigned = Object.values(assignments).filter(Boolean) as AnalyticsImportField[];
  const hasVideoId = assigned.includes('videoId');
  const hasMetric = assigned.some((field) => METRIC_FIELDS.includes(field));
  return hasVideoId && hasMetric;
};

interface ImportMappingStepProps {
  columns: AnalyticsImportDetectedColumn[];
  assignments: HeaderAssignments;
  onChange: (assignments: HeaderAssignments) => void;
  onContinue: () => void;
  warnings?: string[];
}

export const ImportMappingStep: React.FC<ImportMappingStepProps> = ({
  columns,
  assignments,
  onChange,
  onContinue,
  warnings,
}) => {
  const usable = mappingIsUsable(assignments);

  const assign = (header: string, field: AnalyticsImportField | undefined) => {
    const next: HeaderAssignments = { ...assignments };
    // One field, one column: taking a field frees it everywhere else.
    if (field) {
      Object.keys(next).forEach((key) => {
        if (next[key] === field) next[key] = undefined;
      });
    }
    next[header] = field;
    onChange(next);
  };

  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-300">
        We could not confidently place every column in your export. Tell us what these are —
        anything you leave as <span className="text-gray-400">Don’t import</span> is simply
        ignored.
      </p>

      {warnings && warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((warning, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        {columns.map((column) => (
          <div
            key={`${column.header}-${column.index}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-800/60 bg-black/40 p-3"
          >
            {/* LEFT: what the file says */}
            <div className="min-w-0 flex-1 basis-[220px]">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-white">
                <Columns3 className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                {column.header}
              </p>
              {column.sampleValues && column.sampleValues.length > 0 && (
                <p className="mt-1 truncate text-xs text-gray-500">
                  e.g. {column.sampleValues.slice(0, 3).join(' · ')}
                </p>
              )}
            </div>

            {/* RIGHT: what we should call it */}
            <select
              value={assignments[column.header] ?? ''}
              onChange={(e) =>
                assign(
                  column.header,
                  e.target.value ? (e.target.value as AnalyticsImportField) : undefined
                )
              }
              className="min-h-[44px] w-[220px] max-w-full flex-shrink-0 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-[#fa7517]/50 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/40"
            >
              <option value="">Don’t import</option>
              {IMPORT_FIELDS.map((field) => (
                <option key={field.field} value={field.field}>
                  {field.label}
                  {field.required ? ' (required)' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!usable && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Map a <span className="font-semibold">Video ID</span> column and at least one metric to
          continue.
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!usable}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ImportMappingStep;
