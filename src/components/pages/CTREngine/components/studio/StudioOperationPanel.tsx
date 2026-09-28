import React from "react";
import type {
  StudioArtifact,
  StudioOperation,
  StudioOperationItem,
} from "../../../../../types/thumbnailStudio";
import { studioSecondary } from "./StudioControls";
import {
  studioActionNames,
  studioItemFailureMessage,
  studioStateLabels,
} from "../../../../../utils/studioLabels";
const states = studioStateLabels;
const actionNames = studioActionNames;
/**
 * Started work only: its progress, its result and, for a failed output, a
 * one-click Retry. A quote is never shown: pricing is part of the click.
 */
export function StudioOperationPanel({
  operation,
  onRetry,
  renderRetry,
  onUseProposal,
  onDismiss,
  busy,
  projectNames,
  summary,
}: {
  projectNames?: Record<string, string>;
  operation: StudioOperation;
  /** Plain Retry button, when no `renderRetry` is given. */
  onRetry?: (item: StudioOperationItem) => void;
  /** The one-click Retry of a failed output, with its price. */
  renderRetry?: (item: StudioOperationItem) => React.ReactNode;
  onUseProposal?: (artifact: StudioArtifact, operationId: string) => void;
  /** Hide finished work that still offers a retry (it stays until retried or dismissed). */
  onDismiss?: (operation: StudioOperation) => void;
  busy: boolean;
  /** What the work does, shown under its state (for example an edit's change). */
  summary?: React.ReactNode;
}) {
  const dismissible =
    Boolean(onDismiss) &&
    ["succeeded", "partial", "failed"].includes(operation.state) &&
    operation.items.some((item) => item.retryable);
  return (
    <section
      id={`studio-operation-${operation.id}`}
      aria-label="Studio operation"
      className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 tabIndex={-1} data-studio-focus className="font-semibold text-white focus:outline-none">
          {states[operation.state] || states.running}
        </h3>
        <p className="text-sm text-zinc-300">
          {`${operation.capturedCredits} charged · ${operation.releasedCredits} released`}
        </p>
      </div>
      {summary}
      <ul className="space-y-2">
        {operation.items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-xl border border-white/10 p-3 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-white">
                {projectNames?.[item.projectId] &&
                  `${projectNames[item.projectId]} · `}
                {item.preparedConcept?.name ||
                  `${actionNames[item.action]} ${index + 1}`}
              </span>
              <span className="text-zinc-300">
                {states[item.state] || states.queued} · {item.actualCredits} credits
                {!["failed", "succeeded"].includes(item.state)
                  ? ` (${item.quotedCredits} reserved)`
                  : ""}
              </span>
            </div>
            {item.errorCode && item.state === "failed" && (
              <p className="mt-1 text-xs text-amber-200">
                {studioItemFailureMessage(item.errorCode)}
              </p>
            )}
            {item.state === "outcome_unknown" && (
              <p className="mt-2 text-xs text-amber-200">
                No duplicate creation will be sent. We are looking for the
                original result; a retry becomes available only after this check
                ends.
              </p>
            )}
            {item.retryable && (
              <div className="mt-2">
                {renderRetry ? (
                  renderRetry(item)
                ) : (
                  <button
                    type="button"
                    className={studioSecondary}
                    disabled={busy}
                    onClick={() => onRetry?.(item)}
                  >
                    {item.retryMode === "new_preparation" ? "Prepare concepts again" : "Retry"}
                  </button>
                )}
              </div>
            )}
            {item.artifact &&
              !["version", "audit"].includes(item.artifact.kind) &&
              onUseProposal && (
                <div className="mt-3">
                  <p className="text-xs text-zinc-400">
                    A suggestion is ready. Review it before changing your brief
                    or profile.
                  </p>
                  <button
                    className={`${studioSecondary} mt-2`}
                    onClick={() => onUseProposal(item.artifact!, operation.id)}
                  >
                    Review suggestion
                  </button>
                </div>
              )}
          </li>
        ))}
      </ul>
      {dismissible && (
        <button
          type="button"
          className={studioSecondary}
          onClick={() => onDismiss?.(operation)}
        >
          Dismiss
        </button>
      )}
    </section>
  );
}
