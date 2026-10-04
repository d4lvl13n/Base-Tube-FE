import React, { useState } from "react";
import ctrApi from "../../../../api/ctr";
import type { ChannelPackagingAuditV2 } from "../../../../types/ctr";
import type {
  AuditTestStatus,
  AuditTestResult,
  AuditExperimentTracking,
  AuditTestUpdate,
} from "../../../../types/connectedChannelAudit";
import { StudioSelect } from "./studio/StudioSelect";
import { studioField, studioButton } from "./studio/StudioControls";
import "../styles/aiStudio.css";
function TestForm({
  auditId,
  experimentId,
  saved,
  onSaved,
}: {
  auditId: number;
  experimentId: string;
  saved?: AuditExperimentTracking;
  onSaved: (rows: AuditExperimentTracking[]) => void;
}) {
  const [status, setStatus] = useState<AuditTestStatus>(
    saved?.status || "prepared",
  );
  const [result, setResult] = useState<AuditTestResult>(
    saved?.result || "inconclusive",
  );
  const [winner, setWinner] = useState(saved?.winner || ""),
    [start, setStart] = useState(saved?.startDate || ""),
    [end, setEnd] = useState(saved?.endDate || ""),
    [note, setNote] = useState(saved?.note || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const update = () => {
    setError("");
    setSuccess("");
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    update();
    const payload: AuditTestUpdate = {
      status,
      ...(start ? { startDate: start } : {}),
      ...(note ? { note } : {}),
      ...(status === "completed"
        ? { result, endDate: end, ...(result === "winner" ? { winner } : {}) }
        : {}),
    };
    try {
      const rows = await ctrApi.updateAuditExperiment(
        auditId,
        experimentId,
        payload,
      );
      onSaved(rows);
      setSuccess("Saved to this audit.");
    } catch {
      setError(
        "The update was not saved. Check the actual dates and result, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="mt-4 space-y-4">
      {saved && (
        <p className="text-xs text-zinc-400">
          Saved: {saved.status} · Creator reported ·{" "}
          {new Date(saved.updatedAt).toLocaleString()}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Status</span>
          <StudioSelect
            aria-label="Test status"
            value={status}
            disabled={busy}
            onChange={(e) => {
              setStatus(e.target.value as AuditTestStatus);
              update();
            }}
          >
            <option value="prepared">Alternative prepared</option>
            <option value="running">Test running in YouTube Studio</option>
            <option value="completed">Test completed</option>
            <option value="cancelled">Cancelled</option>
          </StudioSelect>
        </label>
        {status === "completed" && (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Result from YouTube Studio</span>
            <StudioSelect
              aria-label="Test result"
              value={result}
              disabled={busy}
              onChange={(e) => {
                setResult(e.target.value as AuditTestResult);
                update();
              }}
            >
              <option value="inconclusive">Inconclusive</option>
              <option value="performed_same">Options performed the same</option>
              <option value="winner">YouTube reported a winner</option>
            </StudioSelect>
          </label>
        )}
        {(status === "running" || status === "completed") && (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Actual start date</span>
            <input
              aria-label="Actual start date"
              className={studioField}
              placeholder="YYYY-MM-DD"
              pattern="\d{4}-\d{2}-\d{2}"
              required
              disabled={busy}
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                update();
              }}
            />
          </label>
        )}
        {status === "completed" && (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Actual end date</span>
            <input
              aria-label="Actual end date"
              className={studioField}
              placeholder="YYYY-MM-DD"
              pattern="\d{4}-\d{2}-\d{2}"
              required
              disabled={busy}
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                update();
              }}
            />
          </label>
        )}
      </div>
      {status === "completed" && result === "winner" && (
        <label className="block space-y-2 text-sm text-zinc-300">
          <span>Winning option</span>
          <input
            aria-label="Winning option"
            className={studioField}
            maxLength={100}
            required
            disabled={busy}
            value={winner}
            onChange={(e) => {
              setWinner(e.target.value);
              update();
            }}
            placeholder="e.g. Variant B — destination first"
          />
        </label>
      )}
      <label className="block space-y-2 text-sm text-zinc-300">
        <span>Notes or result excerpt (optional)</span>
        <textarea
          aria-label="Test notes"
          rows={2}
          className={studioField}
          maxLength={600}
          disabled={busy}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            update();
          }}
        />
      </label>
      <button type="submit" className={studioButton} disabled={busy}>
        {busy ? "Saving…" : "Save test update"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-green-300">
          {success}
        </p>
      )}
      {!!saved?.events.length && (
        <details className="text-sm">
          <summary>Saved test history</summary>
          {saved.events.map((event, i) => (
            <p className="mt-2 text-zinc-400" key={i}>
              {event.recordedAt} · {event.status}
              {event.result ? ` · ${event.result.replace(/_/g, " ")}` : ""}
              {event.winner ? ` · ${event.winner}` : ""}
              {event.note ? ` · ${event.note}` : ""}
            </p>
          ))}
        </details>
      )}
    </form>
  );
}
export function AuditExperimentTracker({
  audit,
}: {
  audit: ChannelPackagingAuditV2;
}) {
  const [tracking, setTracking] = useState(audit.experimentTracking || []);
  if (!audit.connectedAnalysis || !audit.experiments.length || !audit.id)
    return null;
  return (
    <section
      className="ai-audit-report mb-8 rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-7"
      aria-label="Track your packaging tests"
    >
      <h2 className="text-xl font-semibold text-white">
        Prepare, test, and keep the result
      </h2>
      <p className="mt-2 text-sm text-zinc-300">
        Prepare a suggested alternative using the AI Thumbnail actions above.
        Run the native test in YouTube Studio when the video has enough
        exposure, then record its result here.
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Results are declared by you, not automatically retrieved. Record the
        outcome YouTube reports, including equal or inconclusive outcomes; a
        higher CTR alone does not establish a winner.
      </p>
      {audit.experiments.map((experiment) => (
        <details
          key={experiment.id}
          className="mt-5 rounded-xl border border-white/10 p-4"
        >
          <summary>
            {experiment.title}
            {tracking.find((t) => t.experimentId === experiment.id)?.status ===
            "completed"
              ? " · Completed"
              : ""}
          </summary>
          <p className="mt-3 text-sm text-zinc-400">
            {experiment.variantBrief.thumbnail}
          </p>
          <TestForm
            auditId={audit.id!}
            experimentId={experiment.id}
            saved={tracking.find((t) => t.experimentId === experiment.id)}
            onSaved={setTracking}
          />
        </details>
      ))}
    </section>
  );
}
