import React from "react";
import type { ActionAssessment } from "../../../../types/publicChannelAudit";
export const opportunityLabels = {
  correct_now: "Correct now",
  test_if_exposure: "Test if exposure is sufficient",
  monitor_reactivation: "Monitor for reactivation",
  prepare_alternative: "Alternative to prepare",
};
const packagingLabels = {
  documented_issue: "Documented inconsistency",
  possible_improvement: "Possible improvement",
  creative_alternative: "Creative alternative",
  needs_verification: "Needs verification",
};
export const ActionOpportunityContext: React.FC<{
  assessment: ActionAssessment;
  titleFor: (id: string) => string;
}> = ({ assessment: a, titleFor }) => (
  <div className="mt-4 space-y-3 text-sm">
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="font-medium text-white">
        Packaging: {packagingLabels[a.packaging.status]}
      </p>
      <p className="mt-1 text-zinc-400">{a.packaging.reason}</p>
    </div>
    <div>
      <h4 className="font-medium text-white">Why this video now</h4>
      <p className="mt-1 text-zinc-300">{a.opportunity.rationale}</p>
      {a.opportunity.selection.map((v) => (
        <div key={v.videoId} className="mt-3">
          <p className="text-xs font-medium text-zinc-300">
            {titleFor(v.videoId)}
          </p>
          <p className="mt-1 text-zinc-400">{v.whyVideo}</p>
          <p className="mt-1 text-zinc-400">{v.whyNow}</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Still needed: {v.missingInformation.join("; ")}
          </p>
        </div>
      ))}
    </div>
  </div>
);
export const ActionResources: React.FC<{ assessment: ActionAssessment }> = ({
  assessment: a,
}) => (
  <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
    <div>
      <h4 className="font-medium text-white">Effort and source needed</h4>
      <p className="mt-1 text-zinc-300">
        {a.effort.level} effort — {a.effort.reason}
      </p>
      <p className="mt-1 text-zinc-400">{a.effort.requiredSource}</p>
    </div>
    <div>
      <h4 className="font-medium text-white">How to decide</h4>
      <p className="mt-1 text-zinc-300">{a.decisionRule}</p>
    </div>
  </div>
);
