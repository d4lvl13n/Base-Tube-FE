import React, { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import type { ChannelPackagingAuditV2 } from "../../../../types/ctr";
import ctrApi from "../../../../api/ctr";
import { StudioExperimentAction } from "./studio/ChannelStudioHandoff";
import "../styles/aiStudio.css";
import {
  ActionOpportunityContext,
  ActionResources,
  opportunityLabels,
} from "./AuditActionOpportunity";
const categories = {
  observable_inconsistency: "Observable inconsistency",
  composition_adjustment: "Composition adjustment",
  creative_exploration: "Creative exploration — optional",
};
const roundedRatio = (n: number) =>
  n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
export const PublicChannelAuditReview: React.FC<{
  audit: ChannelPackagingAuditV2;
}> = ({ audit }) => {
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState("");
  const r = audit.publicReview,
    research = audit.publicResearch;
  if (!r || !research) return null;
  const evidence = (refs: { videoId: string; observationIndex: number }[]) =>
    refs.map((ref, i) => {
      const v = audit.perVideo.find((v) => v.videoId === ref.videoId);
      return v ? (
        <li key={`${ref.videoId}-${i}`} className="text-sm text-zinc-300">
          <a
            href={`#audit-video-${v.videoId}`}
            className="font-medium text-white underline underline-offset-4"
          >
            {v.title}
          </a>
          <p className="mt-1 text-zinc-400">
            {v.observed[ref.observationIndex]}
          </p>
        </li>
      ) : null;
    });
  const exportHtml = async () => {
    if (!audit.id || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const blob = await ctrApi.exportChannelAudit(audit.id),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `basetube-channel-audit-${audit.id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(
        "The export did not finish. Your saved audit is still available. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <div
      className="ai-audit-report mb-10 space-y-8"
      data-testid="public-channel-audit-review"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">
          {audit.perVideo.length} thumbnails inspected · Public snapshot{" "}
          {new Date(research.asOf).toLocaleDateString()}
        </p>
        <button
          onClick={exportHtml}
          disabled={!audit.id || exporting}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Preparing offline report…" : "Export HTML"}
        </button>
      </div>
      {!audit.id && (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/25 p-4 text-sm text-amber-200"
        >
          This report could not be saved. Keep this page open; history and HTML
          export are unavailable for this result.
        </p>
      )}
      {exportError && (
        <p role="alert" className="text-sm text-red-300">
          {exportError}
        </p>
      )}
      <p className="text-sm text-zinc-300">
        <span className="text-[#fa7517]">
          {r.goal.source === "creator"
            ? "Your goal"
            : "Assumed goal — confirm before applying the advice"}
          :
        </span>{" "}
        {r.goal.text}
      </p>
      {!!r.editorialTasks?.length && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Check / correct
          </h2>
          <div className="space-y-4">
            {r.editorialTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-amber-500/20 p-5"
              >
                <p className="mb-2 text-xs font-semibold text-[#fa7517]">
                  {task.actionAssessment
                    ? opportunityLabels[
                        task.actionAssessment.opportunity.status
                      ]
                    : "Editorial verification"}
                </p>
                <h3 className="font-semibold text-white">{task.title}</h3>
                {task.actionAssessment && (
                  <ActionOpportunityContext
                    assessment={task.actionAssessment}
                    titleFor={(id) =>
                      audit.perVideo.find((v) => v.videoId === id)?.title || id
                    }
                  />
                )}
                <p className="mt-3 text-sm text-white">{task.instruction}</p>
                <p className="mt-2 text-sm text-zinc-400">{task.reason}</p>
                {task.actionAssessment && (
                  <ActionResources assessment={task.actionAssessment} />
                )}
                <details className="thumbnail-disclosure mt-4">
                  <summary>Sources and completion check</summary>
                  <ul className="mt-3 space-y-2">
                    {evidence(task.evidence)}
                    {task.metadataEvidence.map((e, i) => (
                      <li key={i} className="text-xs text-zinc-400">
                        {e.source}: “{e.quote}”
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-zinc-300">
                    {task.completionCheck}
                  </p>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          {research.opportunityVersion === "1"
            ? "Actions and alternatives"
            : research.actionVersion === "2"
              ? "Packaging experiments"
              : "Your next decisions"}
        </h2>
        {!r.decisions.length && (
          <p className="rounded-2xl border border-white/10 p-5 text-sm text-zinc-300">
            {r.editorialTasks?.length
              ? "Complete the editorial checks above before preparing a thumbnail experiment."
              : "No manifest problem was identified in the inspected sources. Keep the current approach. This does not predict performance."}
          </p>
        )}
        <div className="space-y-5">
          {r.decisions.map((d, i) => {
            const exp = audit.experiments.find((e) => e.id === d.experimentId);
            const videos = audit.perVideo.filter((v) =>
              d.evidence.some((e) => e.videoId === v.videoId),
            );
            return (
              <article
                key={d.id}
                id={`audit-decision-${d.id}`}
                className="scroll-mt-24 rounded-2xl border border-[#fa7517]/25 bg-[#fa7517]/[0.035] p-5 sm:p-6"
              >
                <p className="mb-2 text-xs font-semibold text-[#fa7517]">
                  {d.actionAssessment
                    ? opportunityLabels[d.actionAssessment.opportunity.status]
                    : d.category === "creative_exploration"
                      ? "Optional"
                      : `Priority ${i + 1}`}{" "}
                  · {d.category ? categories[d.category] : "Suggested test"}
                </p>
                <h3 className="text-lg font-semibold text-white">{d.title}</h3>
                {d.actionAssessment && (
                  <ActionOpportunityContext
                    assessment={d.actionAssessment}
                    titleFor={(id) =>
                      audit.perVideo.find((v) => v.videoId === id)?.title || id
                    }
                  />
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {videos.map((v) => (
                    <a
                      href={`#audit-video-${v.videoId}`}
                      key={v.videoId}
                      className="w-48 max-w-full"
                    >
                      <img
                        src={v.thumbnailUrl}
                        alt={`Evidence: ${v.title}`}
                        className="w-full rounded-lg"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white">{d.change}</p>
                {!d.actionAssessment && (
                  <p className="mt-2 text-sm text-zinc-400">{d.whyPriority}</p>
                )}
                {d.actionAssessment && (
                  <ActionResources assessment={d.actionAssessment} />
                )}
                <details className="thumbnail-disclosure mt-5">
                  <summary>Evidence, confidence and test plan</summary>
                  <div className="mt-4 space-y-4">
                    <ul className="space-y-3">{evidence(d.evidence)}</ul>
                    <p className="text-sm text-zinc-300">{d.possibleIssue}</p>
                    {!!r.hookChecks?.filter((c) => c.decisionId === d.id)
                      .length && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500">
                          WORDING CHECK — PUBLIC METADATA ONLY
                        </h4>
                        {r.hookChecks
                          .filter((c) => c.decisionId === d.id)
                          .map((c, j) => (
                            <div key={j} className="mt-2 text-xs text-zinc-400">
                              <p className="text-zinc-200">{c.text}</p>
                              {(
                                [
                                  [
                                    "Immediate comprehension",
                                    c.immediateComprehension,
                                  ],
                                  ["Natural language", c.naturalLanguage],
                                  ["Content fidelity", c.contentFidelity],
                                  [
                                    "Subject identification",
                                    c.subjectIdentification,
                                  ],
                                ] as const
                              ).map(([label, check]) => (
                                <p key={label}>
                                  {label}: {check.reason}
                                </p>
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                    {!!d.metadataEvidence?.length && (
                      <ul className="space-y-2 text-xs text-zinc-400">
                        {d.metadataEvidence.map((e, j) => (
                          <li key={j}>
                            {e.source}: “{e.quote}”
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="rounded-xl bg-black/20 p-3 text-xs text-zinc-400">
                      {d.observationReliability && (
                        <p>
                          Observation reliability:{" "}
                          {d.observationReliability.level} —{" "}
                          {d.observationReliability.reason}
                        </p>
                      )}
                      <p>
                        Confidence that a problem exists: {d.confidence.level} —{" "}
                        {d.confidence.reason}
                      </p>
                      {d.counterEvidence && (
                        <p>Other interpretation: {d.counterEvidence}</p>
                      )}
                      <p>Performance effect: unknown.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500">
                        {d.titleOptions.length
                          ? "SUGGESTED TITLES"
                          : "KEEP THE CURRENT TITLE"}
                      </h4>
                      {d.titleUnchangedReason && (
                        <p className="mt-2 text-sm text-zinc-400">
                          {d.titleUnchangedReason}
                        </p>
                      )}
                      {d.titleOptions.map((o, j) => (
                        <div
                          key={j}
                          className="mt-3 rounded-xl border border-white/10 p-3"
                        >
                          <p className="text-sm text-white">{o.title}</p>
                          <p className="text-xs text-zinc-400">{o.reason}</p>
                        </div>
                      ))}
                    </div>
                    {d.visualPlan && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500">
                          VISUAL PREPARATION
                        </h4>
                        <dl className="mt-3 space-y-2 text-sm text-zinc-300">
                          <dt>Subject</dt>
                          <dd>{d.visualPlan.subject}</dd>
                          <dt>Composition</dt>
                          <dd>{d.visualPlan.composition}</dd>
                          <dt>Image text</dt>
                          <dd>{d.visualPlan.text}</dd>
                          <dt>Title contribution</dt>
                          <dd>{d.visualPlan.titleContribution}</dd>
                          <dt>Preserve</dt>
                          <dd>{d.visualPlan.preserve.join("; ")}</dd>
                          <dt>Required source</dt>
                          <dd>{d.visualPlan.requiredSource}</dd>
                        </dl>
                      </div>
                    )}
                    {exp && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500">
                          HOW TO TEST
                        </h4>
                        <p className="mt-2 text-sm text-zinc-300">
                          {exp.method}
                        </p>
                      </div>
                    )}
                    {(d.referenceLessons || []).map((l) => (
                      <p key={l.videoId} className="text-xs text-zinc-400">
                        {l.lesson}{" "}
                        <a
                          href={`#audit-reference-${l.videoId}`}
                          className="text-[#fa7517] underline"
                        >
                          View reference
                        </a>
                      </p>
                    ))}
                  </div>
                </details>
                {exp && (
                  <div className="mt-4">
                    <StudioExperimentAction
                      experiment={exp}
                      auditId={audit.id}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {!!r.videoAssessments?.length ? (
          <details className="thumbnail-disclosure mt-4">
            <summary>What was checked for each video</summary>
            <ul className="mt-3 space-y-3 text-sm text-zinc-400">
              {r.videoAssessments.map((v) => (
                <li key={v.videoId}>
                  <strong className="text-white">
                    {audit.perVideo.find((p) => p.videoId === v.videoId)?.title}
                  </strong>
                  <p>{v.summary}</p>
                  <p className="text-xs">
                    Checked: {v.checked.join(", ")}.{" "}
                    {v.notChecked.length
                      ? "Not checked: " +
                        v.notChecked
                          .map(
                            (s) =>
                              s.source.replace("_", " ") +
                              " (" +
                              s.reason.replace("_", " ") +
                              ")",
                          )
                          .join("; ")
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ) : (
          !!r.noIssueVideoIds.length && (
            <p className="mt-4 text-sm text-zinc-400">
              No manifest issue identified in the inspected title and thumbnail:{" "}
              {r.noIssueVideoIds
                .map(
                  (id) =>
                    audit.perVideo.find((v) => v.videoId === id)?.title || id,
                )
                .join("; ")}
              . Other source coverage was not recorded for this historical
              audit.
            </p>
          )
        )}
      </section>
      {r.recommendationHistory && (
        <details className="thumbnail-disclosure">
          <summary>
            How recommendations changed since the previous audit
          </summary>
          <div className="mt-4 space-y-3 text-sm text-zinc-400">
            <p>
              Previous snapshot:{" "}
              {new Date(r.recommendationHistory.previousAsOf).toLocaleString()}
            </p>
            <p>
              {r.recommendationHistory.reused
                ? "Same collected evidence and goal: previous recommendations retained."
                : "Recorded changes: " +
                  r.recommendationHistory.reasons
                    .map((v) => v.replace(/_/g, " "))
                    .join("; ")}
            </p>
            {r.recommendationHistory.entries.map((entry, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-3">
                <p className="font-medium text-white">
                  {entry.previous.title} — {entry.status.replace(/_/g, " ")}
                </p>
                <p className="mt-1">{entry.explanation}</p>
                <p className="mt-2 text-xs">
                  Previous proposal:{" "}
                  {"change" in entry.previous
                    ? entry.previous.change
                    : entry.previous.instruction}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
      <details className="thumbnail-disclosure">
        <summary>Viewer promise and what to keep</summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-white">{r.promise.assessment}</p>
          <dl className="grid gap-4 sm:grid-cols-2">
            {Object.entries(r.promise)
              .filter(([k]) => k !== "assessment")
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-zinc-500">
                    {k === "publicContent" ? "Public video metadata" : k}
                  </dt>
                  <dd className="text-sm text-zinc-300">{v}</dd>
                </div>
              ))}
          </dl>
          {r.strengths.map((s, i) => (
            <p key={i} className="text-sm text-emerald-300">
              {s.text}
            </p>
          ))}
        </div>
      </details>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Competitive examples worth studying
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Public views help find examples; they cannot prove why a design
          worked. Transferable choices and viewing-use differences matter more
          than shared keywords.
        </p>
        {!research.references.length && (
          <p className="text-sm text-zinc-400">
            No sufficiently relevant reference was found in this search sample.
          </p>
        )}
        {!!r.packagingApproaches?.length && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            {r.packagingApproaches.map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <h3 className="text-sm font-semibold text-white">{a.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{a.difference}</p>
                <p className="mt-2 text-xs text-zinc-400">{a.applicableUse}</p>
                <p className="mt-2 text-xs text-zinc-500">{a.limitation}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {a.referenceVideoIds.map((id) => (
                    <a
                      key={id}
                      href={`#audit-reference-${id}`}
                      className="text-xs text-[#fa7517] underline"
                    >
                      {research.references.find((v) => v.videoId === id)
                        ?.channelTitle || "Reference"}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {research.references.map((ref) => {
            const transfer = r.referenceTransfers?.find(
                (t) => t.videoId === ref.videoId,
              ),
              provenance = ref.baseline.provenance;
            return (
              <article
                id={`audit-reference-${ref.videoId}`}
                key={ref.videoId}
                className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/10"
              >
                <img
                  src={ref.thumbnailUrl}
                  alt={ref.title}
                  className="w-full"
                  loading="lazy"
                />
                <div className="space-y-3 p-4">
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 text-sm font-semibold text-white"
                  >
                    {ref.title}
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                  <p className="text-xs text-zinc-400">
                    {ref.channelTitle} ·{" "}
                    {ref.channelSubscribers === undefined
                      ? "Subscriber count unavailable"
                      : `${ref.channelSubscribers.toLocaleString()} subscribers`}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {ref.viewCount.toLocaleString()} public views ·{" "}
                    {ref.publishedText || "Publication age unknown"} ·{" "}
                    {ref.durationSeconds
                      ? `${Math.round(ref.durationSeconds / 60)} min`
                      : "Duration unknown"}
                  </p>
                  {transfer ? (
                    <>
                      <p className="text-sm text-zinc-200">{transfer.aspect}</p>
                      <p className="text-xs text-zinc-400">
                        {transfer.limitation}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-300">{ref.relevance}</p>
                  )}
                  {ref.selection && (
                    <details className="thumbnail-disclosure">
                      <summary>Why this reference</summary>
                      <div className="mt-3 text-xs text-zinc-400">
                        <p>{ref.selection.reason}</p>
                        <p className="mt-2">
                          Public source: “{ref.selection.viewing.basis}”
                        </p>
                        <p className="mt-2">
                          Relevant to:{" "}
                          {ref.selection.matchedCreatorVideoIds
                            .map(
                              (id) =>
                                audit.perVideo.find((v) => v.videoId === id)
                                  ?.title || id,
                            )
                            .join("; ")}
                        </p>
                      </div>
                    </details>
                  )}
                  <p className="text-xs text-[#fa7517]">
                    {ref.baseline.ratio === null
                      ? "Insufficient comparable public evidence for a descriptive index"
                      : `About ${roundedRatio(ref.baseline.ratio)}× ${ref.baseline.provenance?.selection ? "descriptive snapshot index" : "own-channel median"}${!ref.baseline.provenance?.selection && ref.baseline.isOutlier ? " · descriptive outlier" : ""}`}
                  </p>
                  <details className="thumbnail-disclosure">
                    <summary>Check the comparison and sources</summary>
                    <div className="mt-3 space-y-3 text-xs text-zinc-400">
                      <p>{ref.baseline.caveat}</p>
                      <ul>
                        {ref.observed.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                      {provenance ? (
                        <>
                          <p>
                            Snapshot: {provenance.asOf}. Minimum{" "}
                            {provenance.rules.minimumPeers} peers; median at
                            least {provenance.rules.minimumMedianViews} views.
                            Candidate excluded; duplicate IDs removed.
                          </p>
                          {provenance.selection ? (
                            <div>
                              <p>
                                Age and duration proximity;{" "}
                                {provenance.selection.selectedStage === null
                                  ? "no adequate cohort after widening"
                                  : provenance.selection.expanded
                                    ? "window widened explicitly"
                                    : "initial window"}
                                . At most {provenance.selection.maximumPeers}{" "}
                                closest peers.
                              </p>
                              {provenance.selection.stages.map((stage, i) => (
                                <p key={i}>
                                  Stage {i + 1}:{" "}
                                  {stage.ageMinDays?.toFixed(1) ?? "?"}–
                                  {stage.ageMaxDays?.toFixed(1) ?? "?"} days;{" "}
                                  {stage.durationMinSeconds?.toFixed(0) ?? "?"}–
                                  {stage.durationMaxSeconds?.toFixed(0) ?? "?"}{" "}
                                  seconds; {stage.eligibleCount} eligible videos
                                  {provenance.selection?.selectedStage === i
                                    ? " · selected"
                                    : ""}
                                  .
                                </p>
                              ))}
                              <p>
                                Distance: {provenance.selection.distanceFormula}
                              </p>
                            </div>
                          ) : (
                            <p>
                              Age band (days):{" "}
                              {provenance.rules.ageDays
                                ? `>${provenance.rules.ageDays.minExclusive} to ${provenance.rules.ageDays.maxInclusive ?? "unbounded"}`
                                : "Unknown"}
                              . Duration band (seconds):{" "}
                              {provenance.rules.durationSeconds
                                ? `>${provenance.rules.durationSeconds.minExclusive} to ${provenance.rules.durationSeconds.maxInclusive ?? "unbounded"}`
                                : "Unknown"}
                              .
                            </p>
                          )}
                          <p>{provenance.rules.ageSource}</p>
                          <p>
                            {ref.baseline.sampleSize} peers · median{" "}
                            {ref.baseline.medianViews ?? "unavailable"} views
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr>
                                  <th>Included video</th>
                                  <th>Views</th>
                                  <th>Publication</th>
                                  <th>Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {provenance.members.map((v) => (
                                  <tr key={v.videoId}>
                                    <td>
                                      <a
                                        href={v.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                      >
                                        {v.title}
                                      </a>
                                    </td>
                                    <td>{v.viewCount}</td>
                                    <td>
                                      {v.publishedAt ||
                                        v.publishedText ||
                                        "Unknown"}{" "}
                                      ({v.approximateAgeDays ?? "?"} days)
                                    </td>
                                    <td>{v.durationSeconds ?? "?"}s</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {provenance.excluded.map((v, i) => (
                            <p key={i}>
                              Excluded: {v.video.title} — {v.reasons.join("; ")}{" "}
                              · {v.video.viewCount} views ·{" "}
                              {v.video.publishedText || "Unknown age"} ·{" "}
                              {v.video.durationSeconds ?? "?"}s
                            </p>
                          ))}
                        </>
                      ) : (
                        <p>
                          This historical snapshot did not retain comparison
                          members; its ratio cannot be reproduced from this
                          report.
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <details className="thumbnail-disclosure">
        <summary>Sources, coverage and limits</summary>
        <div className="mt-3 text-sm text-zinc-400">
          {research.publicMomentum && (
            <div>
              <p className="text-white">
                Renewed interest:{" "}
                {research.publicMomentum.status.replace(/_/g, " ")}
              </p>
              <p>{research.publicMomentum.reason}</p>
              <p>
                {research.referenceTracking?.length || 0} selected references
                tracked across saved snapshots. Gaps are not interpreted as
                growth.
              </p>
            </div>
          )}
          <p>Search queries: {research.queries.join(" · ") || "No queries"}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {Array.from(
              new Set([...research.limitations, ...r.limitations]),
            ).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <p className="mt-3">
            The HTML export embeds images and styles and can be read offline. It
            contains the saved public diagnosis.
          </p>
        </div>
      </details>
    </div>
  );
};
