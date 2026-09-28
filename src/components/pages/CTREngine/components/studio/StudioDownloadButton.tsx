import React, { useState } from "react";
import { Download } from "lucide-react";
import {
  studioDownloadErrorMessage,
  studioExportChoiceLabel,
  studioSuggestedExport,
} from "../../../../../api/studioErrors";
import type { StudioExportChoice } from "../../../../../api/studioErrors";

export const studioCompactButton =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * A free Studio download as a compact icon + label button. A refusal shows the
 * server's advice below it, and after EXPORT_TOO_LARGE the format and size that
 * fit, as one click.
 */
export function StudioDownloadButton({ onDownload }: {
  /** `choice`: the export the server suggested, instead of the page's settings. */
  onDownload: (choice?: StudioExportChoice) => Promise<unknown> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState<StudioExportChoice | null>(null);
  const run = async (choice?: StudioExportChoice) => {
    setBusy(true);
    setError("");
    setSuggested(null);
    try {
      await (choice ? onDownload(choice) : onDownload());
    } catch (failure) {
      setError(studioDownloadErrorMessage(failure));
      setSuggested(studioSuggestedExport(failure));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" disabled={busy} onClick={() => void run()} className={studioCompactButton}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Download
      </button>
      {(error || suggested) && (
        <div className="basis-full space-y-2">
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          {suggested && (
            <button type="button" disabled={busy} onClick={() => void run(suggested)} className={studioCompactButton}>
              Download as {studioExportChoiceLabel(suggested)} instead
            </button>
          )}
        </div>
      )}
    </>
  );
}
