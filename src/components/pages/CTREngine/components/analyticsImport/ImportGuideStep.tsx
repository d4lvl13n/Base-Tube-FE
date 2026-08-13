// Step (a) — how to get the file, then drop it in.
//
// The export guide is deliberately four literal clicks: the single biggest
// failure mode of a CSV import is the creator exporting the WRONG report, and
// no parser can recover from that.
//
// Client-side limits mirror the parser's (v2.1 CSV parser rules, LOCKED): .csv
// only, 5MB max. Rejecting here saves a pointless round trip; the backend still
// enforces both.

import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;

interface ImportGuideStepProps {
  onFile: (file: File) => void;
  isAnalyzing: boolean;
  error: string | null;
}

const EXPORT_STEPS = [
  'Open YouTube Studio',
  'Go to Analytics',
  'Switch to Advanced mode',
  'Pick the last 28 days',
  'Export the table as CSV',
];

export const ImportGuideStep: React.FC<ImportGuideStepProps> = ({
  onFile,
  isAnalyzing,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const accept = (file: File | undefined | null) => {
    if (!file) return;
    setLocalError(null);

    const isCsv =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/csv';

    if (!isCsv) {
      setLocalError('That is not a .csv file. Export the table from Studio as CSV.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 5MB. Export a shorter date range.`
      );
      return;
    }
    onFile(file);
  };

  const shownError = localError || error;

  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-300">
        We do not retain the original CSV file. Parsed rows are held temporarily for validation
        for up to one hour; after you confirm, we store only the mapped numbers and video IDs.
        Titles are not committed, and self-reported data is never used in anyone else's benchmarks.
      </p>

      <ol className="mt-4 space-y-2">
        {EXPORT_STEPS.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-[#fa7517]/30 bg-[#fa7517]/10 text-[11px] font-bold text-[#fa7517]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
        YouTube Studio → Analytics → Advanced mode → last 28 days → Export CSV
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={`mt-5 rounded-xl border border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-[#fa7517] bg-[#fa7517]/10'
            : 'border-gray-700 bg-black/30 hover:border-[#fa7517]/40'
        }`}
      >
        <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-500" />
        <p className="mt-3 text-sm font-medium text-white">Drop your CSV here</p>
        <p className="mt-1 text-xs text-gray-500">.csv only · up to 5MB</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            // Allow re-picking the same file after a rejection.
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isAnalyzing}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 transition-all hover:from-[#fa7517]/90 hover:to-orange-500/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Reading your export…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Choose a file
            </>
          )}
        </button>
      </div>

      {shownError && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {shownError}
        </p>
      )}
    </div>
  );
};

export default ImportGuideStep;
