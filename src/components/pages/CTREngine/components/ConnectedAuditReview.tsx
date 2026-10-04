import React from "react";
import type { ChannelPackagingAuditV2 } from "../../../../types/ctr";
import "../styles/aiStudio.css";
const labels = {
  packaging_opportunity: "Packaging alternative worth testing",
  verify_promise: "Check what the video promises",
  preserve: "Preserve the current packaging",
  wait_for_exposure: "Wait for more exposure",
  insufficient_comparison: "Alternative to prepare — priority unconfirmed",
};
const number = (n: number | null) =>
  n === null
    ? "Not available"
    : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export function ConnectedAuditReview({
  audit,
}: {
  audit: ChannelPackagingAuditV2;
}) {
  const analysis = audit.connectedAnalysis;
  if (!analysis) return null;
  return (
    <section
      className="ai-audit-report mb-8 rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-7"
      aria-label="Connected audit opportunities"
    >
      <h2 className="text-xl font-semibold text-white">
        Which videos deserve your attention?
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Decision snapshot: {new Date(analysis.asOf).toLocaleDateString()} ·
        Measurements: {analysis.window.start} – {analysis.window.end}.
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        These decisions use the saved analysis period. Metric cards below may
        refresh when you reopen the audit; the recommendations do not silently
        change.
      </p>
      {!analysis.comparisonsEnabled && (
        <p className="mt-3 text-sm text-amber-200">
          Comparative analytics are not enabled for this connection. The public
          visual diagnosis remains available.
        </p>
      )}
      {analysis.selectionMode === "public_fallback" && (
        <p className="mt-3 text-sm text-zinc-400">
          Public sampling was used because connected comparisons or period
          coverage were unavailable.
        </p>
      )}
      <div className="mt-5 space-y-3">
        {analysis.videos
          .filter((v) => v.selected)
          .map((v) => (
            <article
              key={v.videoId}
              className="rounded-xl border border-white/10 p-4"
            >
              <p className="text-xs font-semibold text-orange-300">
                {labels[v.kind]}
              </p>
              <a
                href={`#audit-video-${v.videoId}`}
                className="mt-1 block text-sm font-semibold text-white underline underline-offset-4"
              >
                {v.title}
              </a>
              <p className="mt-2 text-sm text-zinc-300">{v.summary}</p>
              <p className="mt-2 text-sm text-white">{v.nextAction}</p>
              <details className="mt-3 text-sm">
                <summary>
                  Why this video, evidence and missing information
                </summary>
                <p className="mt-3 text-zinc-300">{v.selectionReason}</p>
                <p className="mt-2 text-zinc-400">
                  Recorded impressions: {number(v.impressions)} · CTR:{" "}
                  {number(v.ctr)}
                  {v.ctr !== null && "%"} · Average viewed:{" "}
                  {number(v.averageViewPercentage)}
                  {v.averageViewPercentage !== null && "%"}
                </p>
                <p className="mt-2 text-zinc-400">
                  Traffic{v.trafficBasis ? ` (by ${v.trafficBasis})` : ""}:{" "}
                  {v.trafficBasis
                    ? v.source || "Not established"
                    : "Not established"}{" "}
                  · Peer CTR median: {number(v.baselineCtr)}
                  {v.baselineCtr !== null && "%"} · Peer viewing median:{" "}
                  {number(v.baselineViewPercentage)}
                  {v.baselineViewPercentage !== null && "%"}
                </p>
                <p className="mt-2 text-zinc-400">
                  Peers require matching viewer intent, editorial format,
                  source, measurement coverage, similar age and duration. This
                  is an observational comparison.
                </p>
                {v.peers.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {v.peers.map((peer) => (
                      <li key={peer.videoId}>
                        <a
                          className="text-orange-300 underline"
                          href={`https://www.youtube.com/watch?v=${encodeURIComponent(peer.videoId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {analysis.videos.find(
                            (row) => row.videoId === peer.videoId,
                          )?.title || peer.videoId}
                        </a>
                        <span className="text-zinc-400">
                          {" "}
                          · CTR {number(peer.ctr)}% · {peer.ageDays} days old ·{" "}
                          {Math.round(peer.durationSeconds / 60)} min
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="mt-3 list-disc space-y-1 pl-4 text-zinc-400">
                  {v.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
      </div>
      {analysis.history && (
        <details className="mt-5 text-sm">
          <summary>Changes since the previous connected audit</summary>
          <p className="mt-3 text-zinc-400">
            Previous period: {analysis.history.previousWindow.start} –{" "}
            {analysis.history.previousWindow.end}
          </p>
          <ul className="mt-2 list-disc pl-4 text-zinc-300">
            {analysis.history.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {analysis.history.previousProposals.map((p) => (
            <p key={p.id} className="mt-3 text-zinc-400">
              <b className="text-white">Previous proposal: {p.title}</b>
              <br />
              {p.change}
            </p>
          ))}
          {analysis.history.previousTests?.map((t) => (
            <p className="mt-2 text-zinc-400" key={t.proposalKey}>
              Previous creator-reported test: {t.status}
              {t.result ? ` · ${t.result.replace(/_/g, " ")}` : ""}
              {t.winner ? ` · ${t.winner}` : ""}. Recorded {t.updatedAt}.
              Results only carry forward when the exact proposal is unchanged.
            </p>
          ))}
        </details>
      )}
      <details className="mt-4 text-sm">
        <summary>Scope and interpretation</summary>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-zinc-400">
          {analysis.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
