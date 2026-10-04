import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicChannelAuditReview } from "../PublicChannelAuditReview";
import ctrApi from "../../../../../api/ctr";
jest.mock("../../../../../api/ctr", () => ({
  __esModule: true,
  default: { exportChannelAudit: jest.fn() },
}));
jest.mock("../studio/ChannelStudioHandoff", () => ({
  StudioExperimentAction: () => (
    <button>Use this suggestion in AI Thumbnail</button>
  ),
}));
const audit: any = {
  id: 1,
  perVideo: [
    {
      videoId: "v1",
      title: "Socotra",
      observed: ["The text covers the person in red."],
    },
  ],
  experiments: [
    {
      id: "exp-1",
      variantBrief: { thumbnail: "Move label above the person" },
      method: "Test if available; allow an inconclusive result.",
    },
  ],
  publicResearch: {
    asOf: "2026-10-03T00:00:00Z",
    references: [],
    suggestions: [],
    queries: ["Socotra aerial"],
    limitations: ["Public data only."],
  },
  publicReview: {
    goal: { text: "Relax on television", source: "creator" },
    promise: {
      channel: "Aerial films",
      titles: "Destination",
      thumbnails: "Music",
      publicContent: "Long videos; not watched",
      assessment: "Clarify the viewer use case",
    },
    strengths: [
      {
        text: "Keep the authentic scene",
        evidence: [{ videoId: "v1", observationIndex: 0 }],
      },
    ],
    decisions: [
      {
        id: "d1",
        title: "Reveal the person",
        evidence: [{ videoId: "v1", observationIndex: 0 }],
        possibleIssue: "The subject may be harder to identify",
        change: "Place the label in the empty upper area",
        whyPriority: "Preserve the visual point of interest",
        confidence: { level: "high", reason: "The overlap is visible" },
        titleOptions: [
          {
            title: "Socotra 4K — a relaxing journey",
            reason: "States destination and viewing use",
          },
        ],
        referenceVideoIds: [],
        experimentId: "exp-1",
      },
    ],
    noIssueVideoIds: [],
    limitations: ["CTR is unknown."],
  },
};
it("connects exact observed evidence, diagnosis, change, title and existing thumbnail action", () => {
  render(<PublicChannelAuditReview audit={audit} />);
  expect(
    screen.getAllByText("The text covers the person in red."),
  ).toHaveLength(1);
  expect(
    screen.getByText("The subject may be harder to identify"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Place the label in the empty upper area"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Socotra 4K — a relaxing journey"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Use this suggestion in AI Thumbnail" }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Generate now/)).not.toBeInTheDocument();
});
it("disables export and clearly warns if the result was not saved", () => {
  render(<PublicChannelAuditReview audit={{ ...audit, id: undefined }} />);
  expect(screen.getByRole("button", { name: "Export HTML" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
});
it("reports export failure without losing the saved report", async () => {
  (ctrApi.exportChannelAudit as jest.Mock).mockRejectedValueOnce(
    Error("network"),
  );
  render(<PublicChannelAuditReview audit={audit} />);
  fireEvent.click(screen.getByRole("button", { name: "Export HTML" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your saved audit is still available",
    ),
  );
  expect(ctrApi.exportChannelAudit).toHaveBeenCalledWith(1);
});
it("accepts an explicit no-issue conclusion without forced suggestions", () => {
  render(
    <PublicChannelAuditReview
      audit={{
        ...audit,
        publicReview: {
          ...audit.publicReview,
          decisions: [],
          noIssueVideoIds: ["v1"],
        },
      }}
    />,
  );
  expect(
    screen.getByText(/No manifest problem was identified/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Use this suggestion in AI Thumbnail",
    }),
  ).not.toBeInTheDocument();
});
it('separates observation reliability, problem confidence and unknown performance in collapsed details', () => {
  render(<PublicChannelAuditReview audit={{...audit,publicReview:{...audit.publicReview,decisions:[{...audit.publicReview.decisions[0],category:'composition_adjustment',observationReliability:{level:'high',reason:'Second automated image read'},confidence:{level:'medium',reason:'The person remains recognizable'},counterEvidence:'The letter opening may deliberately frame the person',performanceEffect:'unknown'}]}}} />);
  expect(screen.getByText(/Composition adjustment/)).toBeInTheDocument();
  expect(screen.getByText(/Observation reliability: high/)).toBeInTheDocument();
  expect(screen.getByText(/Confidence that a problem exists: medium/)).toBeInTheDocument();
  expect(screen.getByText('Performance effect: unknown.')).toBeInTheDocument();
  expect(screen.getByText(/The letter opening may deliberately/).closest('details')).not.toHaveAttribute('open');
  expect(screen.getByAltText('Evidence: Socotra')).toBeVisible();
});
it('shows approximate ratios and the actual comparison members instead of unsupported decimal precision', () => {
  const reference:any={videoId:'ref1',title:'Reference journey',thumbnailUrl:'https://i.ytimg.com/ref.jpg',url:'https://www.youtube.com/watch?v=ref1',channelTitle:'Peer',viewCount:65000,observed:[],baseline:{ratio:48.91,isOutlier:true,medianViews:1329,sampleSize:5,caveat:'Lifetime views; no causality.',provenance:{asOf:'2026-10-03',rules:{minimumPeers:5,minimumMedianViews:100,ageDays:{minExclusive:30,maxInclusive:180},durationSeconds:{minExclusive:1200,maxInclusive:3600},ageSource:'Relative date approximate'},members:[{videoId:'peer1',title:'Included reference peer',url:'https://www.youtube.com/watch?v=peer1',viewCount:1329,publishedText:'2 months ago',approximateAgeDays:60,durationSeconds:1500}],excluded:[]}}};
  render(<PublicChannelAuditReview audit={{...audit,publicResearch:{...audit.publicResearch,references:[reference]}}} />);
  expect(screen.getByText(/About 49× own-channel median/)).toBeInTheDocument();
  expect(screen.queryByText(/48.91×/)).not.toBeInTheDocument();
  expect(screen.getByText('Included reference peer')).toBeInTheDocument();
  expect(screen.getByText(/Age band \(days\): >30 to 180/)).toBeInTheDocument();
});
it('shows editorial-only tasks without offering thumbnail generation, and names unverified sources',()=>{
 render(<PublicChannelAuditReview audit={{...audit,experiments:[],publicResearch:{...audit.publicResearch,actionVersion:'2'},publicReview:{...audit.publicReview,decisions:[],noIssueVideoIds:[],editorialTasks:[{id:'check',title:'Verify the music',evidence:[{videoId:'v1',observationIndex:0}],metadataEvidence:[],instruction:'Listen before changing the label',reason:'Audio not checked',completionCheck:'The labels agree'}],videoAssessments:[{videoId:'v1',status:'verification_needed',checked:['title','thumbnail'],notChecked:[{source:'description',reason:'not_retrieved'}],summary:'Description coherence was not verified.'}]}}} />);
 expect(screen.getByText('Check / correct')).toBeInTheDocument();
 expect(screen.getByText('Listen before changing the label')).toBeInTheDocument();
 expect(screen.getByText('Description coherence was not verified.')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Use this suggestion in AI Thumbnail'})).not.toBeInTheDocument();
});
it('provides a concrete visual preparation beside the existing experiment handoff',()=>{
 render(<PublicChannelAuditReview audit={{...audit,publicResearch:{...audit.publicResearch,actionVersion:'2'},publicReview:{...audit.publicReview,decisions:[{...audit.publicReview.decisions[0],visualPlan:{subject:'Authentic coastline frame',composition:'Keep coastline visible and move label to empty upper third',text:'SOCOTRA',titleContribution:'Title supplies the TV use case',preserve:['Logo','Colour palette'],requiredSource:'Use an actual frame from the film'}}]}}} />);
 expect(screen.getByText('Authentic coastline frame')).toBeInTheDocument();
 expect(screen.getByText('Use an actual frame from the film')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Use this suggestion in AI Thumbnail'})).toBeInTheDocument();
});
it('separates an archival packaging alternative from growth priority and explains the selection and missing exposure',()=>{
 const a:any={packaging:{status:'possible_improvement',reason:'Outcome could be clearer'},opportunity:{status:'monitor_reactivation',rationale:'Old guide; no current-interest evidence',selection:[{videoId:'v1',whyVideo:'Useful evergreen guide',whyNow:'Prepare only until renewed interest is corroborated',missingInformation:['Current impressions in Studio']}]},effort:{level:'medium',reason:'Select an authentic frame',requiredSource:'Original footage'},decisionRule:'Monitor; do not spend on a test without exposure'};
 render(<PublicChannelAuditReview audit={{...audit,publicResearch:{...audit.publicResearch,opportunityVersion:'1'},publicReview:{...audit.publicReview,decisions:[{...audit.publicReview.decisions[0],actionAssessment:a}],recommendationHistory:{previousAsOf:'2026-10-01',reused:true,reasons:[],entries:[{kind:'decision',previous:{...audit.publicReview.decisions[0],change:'Previous composition'},status:'retained',explanation:'Identical sources retained'}]}}}}/>);
 expect(screen.getByText(/Monitor for reactivation/)).toBeInTheDocument();
 expect(screen.getByText(/Packaging: Possible improvement/)).toBeInTheDocument();
 expect(screen.getByText('Why this video now')).toBeInTheDocument();
 expect(screen.getByText(/Still needed: Current impressions/)).toBeInTheDocument();
 expect(screen.getByText('Original footage')).toBeInTheDocument();
 expect(screen.queryByText(/Priority 1/)).not.toBeInTheDocument();
 expect(screen.getByText(/Previous proposal: Previous composition/)).toBeInTheDocument();
});
