// src/components/pages/CTREngine/components/analyticsImport/AnalyticsImportModal.tsx
//
// The Studio-export stepper — the self-reported half of the v2.1 two-source
// story (spec: "Upload-first" journey, LOCKED).
//
//   guide     export instructions + file drop  → POST /analytics-import/analyze
//   mapping   ONLY when the parser says needsMapping
//   coverage  MANDATORY date-range + number-format confirmation → POST /:id/confirm (DRY RUN)
//   review    validation preview (matched / skipped / units) → POST /:id/commit
//   done      success + "re-run the audit"
//
// Note on where the commit happens: `/confirm` is a DRY RUN — it produces the
// matched / rejected / units figures plus a single-use validationToken, but
// writes NOTHING. Only "Confirm import" on the review screen calls `/commit`
// with that token. Closing the modal at the review step therefore imports
// nothing, and "Use a different file" walks back to the start with zero rows
// to undo.
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
  AnalyticsImportField,
  AnalyticsImportLocale,
  AnalyticsImportResult,
} from '../../../../../types/ctr';
import ImportGuideStep from './ImportGuideStep';
import ImportMappingStep, {
  IMPORT_FIELDS,
  mappingIsUsable,
  toImportMapping,
  type ColumnAssignments,
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
  const [assignments, setAssignments] = useState<ColumnAssignments>({});
  const [coverageKind, setCoverageKind] = useState<'date_range' | 'lifetime' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // The number format the USER picked. Detection never writes this — it only
  // badges an option on the coverage step (the click IS the confirmation).
  const [locale, setLocale] = useState<AnalyticsImportLocale | null>(null);
  const [detectedLocale, setDetectedLocale] = useState<AnalyticsImportLocale | null>(null);
  const [result, setResult] = useState<AnalyticsImportResult | null>(null);
  const [accepted, setAccepted] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  /**
   * Generation token for in-flight requests. `reset()` bumps it, and every
   * async handler re-checks it after each await: a close that raced an
   * analyze/confirm/commit therefore makes the late resolution a no-op instead
   * of letting its setState calls resurrect the flow post-reset.
   */
  const generationRef = React.useRef(0);

  const reset = useCallback(() => {
    generationRef.current += 1;
    setStep('guide');
    setAnalysis(null);
    setAssignments({});
    setCoverageKind(null);
    setStartDate('');
    setEndDate('');
    setLocale(null);
    setDetectedLocale(null);
    setResult(null);
    setAccepted(false);
    setIsAnalyzing(false);
    setIsConfirming(false);
    setIsCommitting(false);
    setError(null);
    setUnavailable(false);
  }, []);

  /**
   * EVERY close path goes through here (Escape, backdrop, the X, re-run).
   * The parent keeps this component mounted, so a close that skipped `reset`
   * would resurrect the whole flow — including a checked number format — on
   * the next open. Nothing is lost by resetting: the commit is explicit, so a
   * closed modal has, by construction, imported nothing.
   */
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Close on Escape — a modal that traps a creator mid-upload is worse than one
  // they can leave and come back to.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const handleFile = async (file: File) => {
    const gen = generationRef.current;
    setError(null);
    setUnavailable(false);
    setIsAnalyzing(true);
    try {
      const parsed = await ctrApi.analyzeAnalyticsImport(file);
      if (generationRef.current !== gen) return; // closed while in flight
      setAnalysis(parsed);

      if (parsed.status === 'rejected') {
        setError(
          parsed.rejectionReason ||
            'That file could not be read. Export the table again from Studio and retry.'
        );
        return;
      }

      // Seed the mapping form from the parser's suggestions (field → column
      // INDEX — the index is the identity, duplicate headers are legal).
      const seeded: ColumnAssignments = {};
      const claimed = new Set<AnalyticsImportField>();
      Object.entries(parsed.suggestedMapping ?? {}).forEach(([field, index]) => {
        if (typeof index === 'number') {
          seeded[index] = field as AnalyticsImportField;
          claimed.add(field as AnalyticsImportField);
        }
      });
      parsed.detectedColumns?.forEach((column) => {
        if (
          seeded[column.index] === undefined &&
          column.suggestedField &&
          !claimed.has(column.suggestedField)
        ) {
          seeded[column.index] = column.suggestedField;
          claimed.add(column.suggestedField);
        }
      });
      setAssignments(seeded);

      // Prefill the range from detection — a PREFILL, never an assumption: the
      // radio starts unselected so the user has to actually choose.
      const detected = parsed.detectedCoverage;
      if (detected?.startDate) setStartDate(detected.startDate.slice(0, 10));
      if (detected?.endDate) setEndDate(detected.endDate.slice(0, 10));

      // The number format is NEVER pre-selected: detection only badges an
      // option ("Looks like your file") and the user has to click one. A
      // detection the backend could not make (null) simply shows no badge.
      const supported: AnalyticsImportLocale[] = ['en', 'fr', 'de', 'es'];
      setLocale(null);
      setDetectedLocale(supported.find((code) => code === parsed.detectedLocale) ?? null);

      setStep(parsed.needsMapping ? 'mapping' : 'coverage');
    } catch (err: any) {
      if (generationRef.current !== gen) return;
      if (err?.message === ANALYTICS_IMPORT_UNAVAILABLE) {
        setUnavailable(true);
      } else {
        setError(err?.message || 'Could not read that export. Please try again.');
      }
    } finally {
      if (generationRef.current === gen) setIsAnalyzing(false);
    }
  };

  /**
   * The DRY RUN. Validates mapping + coverage + locale server-side and comes
   * back with the matched/skipped/units preview and a validationToken. Nothing
   * is written yet.
   */
  const handleConfirm = async () => {
    if (!analysis) return;
    const coverage = coverageFromForm(coverageKind, startDate, endDate);
    if (!coverage || !locale) return;

    const gen = generationRef.current;
    setError(null);
    setIsConfirming(true);
    try {
      const confirmed = await ctrApi.confirmAnalyticsImport(analysis.importId, {
        // Full mapping, one entry per canonical field: the column index, or an
        // explicit null so an un-assigned suggestion can never silently survive.
        // (Assignments were seeded from the parser's suggestion, so a confident
        // parse with no mapping step still sends the right indices.)
        mapping: toImportMapping(assignments),
        coverage,
        locale,
      });
      if (generationRef.current !== gen) return; // closed while in flight
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
      if (generationRef.current !== gen) return;
      if (err?.message === ANALYTICS_IMPORT_UNAVAILABLE) {
        setUnavailable(true);
      } else {
        setError(err?.message || 'Could not check that import. Please try again.');
      }
    } finally {
      if (generationRef.current === gen) setIsConfirming(false);
    }
  };

  /** The WRITE. Spends the dry run's single-use token — this is the only call
   *  that persists rows. */
  const handleCommit = async () => {
    if (!analysis || !result?.validationToken) {
      setError('This preview has expired. Please upload the file again.');
      return;
    }

    const gen = generationRef.current;
    setError(null);
    setIsCommitting(true);
    try {
      const committed = await ctrApi.commitAnalyticsImport(
        analysis.importId,
        result.validationToken
      );
      // Even here we only drop the UI update: the commit itself already
      // happened server-side, and reopening shows it via the latest-import
      // summary rather than a resurrected success screen.
      if (generationRef.current !== gen) return;
      setResult(committed);
      setAccepted(true);
      setStep('done');
    } catch (err: any) {
      if (generationRef.current !== gen) return;
      if (err?.message === ANALYTICS_IMPORT_UNAVAILABLE) {
        setUnavailable(true);
      } else {
        setError(err?.message || 'Could not save that import. Please try again.');
      }
    } finally {
      if (generationRef.current === gen) setIsCommitting(false);
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
      onClick={handleClose}
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
            onClick={handleClose}
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
                locale={locale}
                detectedLocale={detectedLocale}
                onLocaleChange={setLocale}
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
                onAccept={handleCommit}
                isCommitting={isCommitting}
                error={step === 'review' ? error : null}
                onStartOver={reset}
                onRerunAudit={() => {
                  onImported(result);
                  handleClose();
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
