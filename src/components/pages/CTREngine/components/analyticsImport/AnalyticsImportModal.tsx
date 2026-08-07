// src/components/pages/CTREngine/components/analyticsImport/AnalyticsImportModal.tsx
//
// The Studio-export stepper — the self-reported half of the v2.1 two-source
// story (spec: "Upload-first" journey, LOCKED).
//
//   guide     export instructions + file drop  → POST /analytics-import/analyze
//   mapping   ONLY when the parser says needsMapping
//   coverage  MANDATORY date-range confirmation → POST /:id/confirm
//   review    validation preview (matched / skipped / units) → Confirm
//   done      success + "re-run the audit"
//
// Note on where the commit happens: `/confirm` is what produces the matched /
// rejected / units figures, so it runs at the end of the COVERAGE step and the
// review screen shows its result. "Confirm import" is therefore the user
// accepting that result — and "Use a different file" walks back to the start
// rather than editing a committed import.
//
// The endpoints are backend M2. Until they exist the analyze call 404s, which
// `ctrApi` reports as ANALYTICS_IMPORT_UNAVAILABLE — rendered here as a plain
// "not available yet" note, not an error.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Clock } from 'lucide-react';
import ctrApi, { ANALYTICS_IMPORT_UNAVAILABLE } from '../../../../../api/ctr';
import type {
  AnalyticsImportAnalysis,
  AnalyticsImportMapping,
  AnalyticsImportResult,
} from '../../../../../types/ctr';
import ImportGuideStep from './ImportGuideStep';
import ImportMappingStep, {
  IMPORT_FIELDS,
  mappingIsUsable,
  type HeaderAssignments,
} from './ImportMappingStep';
import ImportCoverageStep, { coverageFromForm } from './ImportCoverageStep';
import ImportReviewStep from './ImportReviewStep';

type Step = 'guide' | 'mapping' | 'coverage' | 'review' | 'done';

const STEP_TITLES: Record<Step, string> = {
  guide: 'Upload your Studio export',
  mapping: 'Confirm the columns',
  coverage: 'Confirm the date range',
  review: 'Check what we read',
  done: 'Import complete',
};

/** Visible progress. `mapping` is conditional, so it is only counted when used. */
const stepSequence = (needsMapping: boolean): Step[] =>
  needsMapping
    ? ['guide', 'mapping', 'coverage', 'review']
    : ['guide', 'coverage', 'review'];

interface AnalyticsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fired once the user accepts the import — the page re-runs the audit. */
  onImported: (result: AnalyticsImportResult) => void;
}

export const AnalyticsImportModal: React.FC<AnalyticsImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const [step, setStep] = useState<Step>('guide');
  const [analysis, setAnalysis] = useState<AnalyticsImportAnalysis | null>(null);
  const [assignments, setAssignments] = useState<HeaderAssignments>({});
  const [coverageKind, setCoverageKind] = useState<'date_range' | 'lifetime' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<AnalyticsImportResult | null>(null);
  const [accepted, setAccepted] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const reset = useCallback(() => {
    setStep('guide');
    setAnalysis(null);
    setAssignments({});
    setCoverageKind(null);
    setStartDate('');
    setEndDate('');
    setResult(null);
    setAccepted(false);
    setIsAnalyzing(false);
    setIsConfirming(false);
    setError(null);
    setUnavailable(false);
  }, []);

  // Close on Escape — a modal that traps a creator mid-upload is worse than one
  // they can leave and come back to.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleFile = async (file: File) => {
    setError(null);
    setUnavailable(false);
    setIsAnalyzing(true);
    try {
      const parsed = await ctrApi.analyzeAnalyticsImport(file);
      setAnalysis(parsed);

      if (parsed.status === 'rejected') {
        setError(
          parsed.rejectionReason ||
            'That file could not be read. Export the table again from Studio and retry.'
        );
        return;
      }

      // Seed the mapping form from the parser's suggestions (header → field).
      const seeded: HeaderAssignments = {};
      Object.entries(parsed.suggestedMapping ?? {}).forEach(([field, header]) => {
        if (header) seeded[header] = field as keyof AnalyticsImportMapping;
      });
      parsed.detectedColumns?.forEach((column) => {
        if (!(column.header in seeded) && column.suggestedField) {
          seeded[column.header] = column.suggestedField;
        }
      });
      setAssignments(seeded);

      // Prefill the range from detection — a PREFILL, never an assumption: the
      // radio starts unselected so the user has to actually choose.
      const detected = parsed.detectedCoverage;
      if (detected?.startDate) setStartDate(detected.startDate.slice(0, 10));
      if (detected?.endDate) setEndDate(detected.endDate.slice(0, 10));

      setStep(parsed.needsMapping ? 'mapping' : 'coverage');
    } catch (err: any) {
      if (err?.message === ANALYTICS_IMPORT_UNAVAILABLE) {
        setUnavailable(true);
      } else {
        setError(err?.message || 'Could not read that export. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Invert header → field back into the contract's field → header mapping. */
  const buildMapping = (): AnalyticsImportMapping => {
    const mapping: AnalyticsImportMapping = {};
    Object.entries(assignments).forEach(([header, field]) => {
      if (field) mapping[field] = header;
    });
    return mapping;
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    const coverage = coverageFromForm(coverageKind, startDate, endDate);
    if (!coverage) return;

    const mapping = buildMapping();
    // When the parser was confident we may have no assignments at all — send its
    // suggestion through unchanged rather than an empty object.
    const payloadMapping =
      Object.keys(mapping).length > 0 ? mapping : analysis.suggestedMapping ?? {};

    setError(null);
    setIsConfirming(true);
    try {
      const confirmed = await ctrApi.confirmAnalyticsImport(analysis.importId, {
        mapping: payloadMapping,
        coverage,
        locale: analysis.detectedLocale || undefined,
      });
      setResult(confirmed);

      if (confirmed.status === 'rejected') {
        setError(
          confirmed.rejectionReason ||
            'That import was rejected. Check the export and try again.'
        );
        return;
      }
      setStep('review');
    } catch (err: any) {
      if (err?.message === ANALYTICS_IMPORT_UNAVAILABLE) {
        setUnavailable(true);
      } else {
        setError(err?.message || 'Could not save that import. Please try again.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const sequence = useMemo(
    () => stepSequence(!!analysis?.needsMapping),
    [analysis?.needsMapping]
  );
  const stepIndex = Math.max(0, sequence.indexOf(step === 'done' ? 'review' : step));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Upload your YouTube Studio export"
        className="my-8 w-[640px] max-w-full rounded-2xl border border-gray-800/60 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Upload className="h-5 w-5 text-[#fa7517]" />
              {STEP_TITLES[step]}
            </h2>
            {step !== 'done' && (
              <p className="mt-1 text-xs text-gray-500">
                Step {stepIndex + 1} of {sequence.length}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress rail */}
        {step !== 'done' && (
          <div className="mb-5 flex gap-1.5">
            {sequence.map((name, index) => (
              <span
                key={name}
                className={`h-1 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-[#fa7517]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        {unavailable ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4 text-[#fa7517]" />
              Studio imports aren’t switched on yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              This is being rolled out — the upload endpoint isn’t live on this environment. In
              the meantime, connecting YouTube gives you the same cards, verified.
            </p>
          </div>
        ) : (
          <>
            {step === 'guide' && (
              <ImportGuideStep onFile={handleFile} isAnalyzing={isAnalyzing} error={error} />
            )}

            {step === 'mapping' && analysis && (
              <ImportMappingStep
                columns={analysis.detectedColumns ?? []}
                assignments={assignments}
                onChange={setAssignments}
                warnings={analysis.warnings}
                onContinue={() => {
                  if (mappingIsUsable(assignments)) setStep('coverage');
                }}
              />
            )}

            {step === 'coverage' && analysis && (
              <ImportCoverageStep
                detected={analysis.detectedCoverage}
                kind={coverageKind}
                startDate={startDate}
                endDate={endDate}
                onChange={(next) => {
                  setCoverageKind(next.kind);
                  setStartDate(next.startDate);
                  setEndDate(next.endDate);
                }}
                onContinue={handleConfirm}
                isSubmitting={isConfirming}
                error={error}
              />
            )}

            {(step === 'review' || step === 'done') && result && (
              <ImportReviewStep
                result={result}
                accepted={accepted}
                onAccept={() => {
                  setAccepted(true);
                  setStep('done');
                }}
                onStartOver={reset}
                onRerunAudit={() => {
                  onImported(result);
                  onClose();
                  reset();
                }}
              />
            )}
          </>
        )}

        {/* What the mapping screen is choosing between, spelled out once. */}
        {step === 'mapping' && (
          <p className="mt-4 text-[11px] leading-relaxed text-gray-600">
            {IMPORT_FIELDS.map((field) => `${field.label}: ${field.hint}`).join(' · ')}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsImportModal;
