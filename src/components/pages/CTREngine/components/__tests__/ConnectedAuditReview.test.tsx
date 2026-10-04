import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectedAuditReview } from "../ConnectedAuditReview";
import { AuditExperimentTracker } from "../AuditExperimentTracker";
import ctrApi from "../../../../../api/ctr";
jest.mock("../../../../../api/ctr", () => ({
  __esModule: true,
  default: { updateAuditExperiment: jest.fn() },
}));
jest.mock("../studio/StudioControls", () => ({
  studioField: "field",
  studioButton: "button",
}));
// Keep the real existing Headless UI select; do not verify an invented native replacement.
const audit: any = {
  id: 42,
  experiments: [
    {
      id: "e1",
      title: "Destination first",
      variantBrief: { thumbnail: "Use an authentic scene" },
    },
  ],
  connectedAnalysis: {
    asOf: "2026-10-03T00:00:00Z",
    window: { start: "2026-09-05", end: "2026-10-02" },
    comparisonsEnabled: true,
    selectionMode: "connected_opportunities",
    limitations: ["Observational comparison only"],
    videos: [
      {
        videoId: "v1",
        title: "Guide",
        selected: true,
        kind: "packaging_opportunity",
        summary: "Still exposed with lower CTR",
        nextAction: "Prepare a native test",
        selectionReason: "Current exposure",
        impressions: 5000,
        ctr: 2,
        averageViewPercentage: 45,
        source: "browse",
        baselineCtr: 6,
        baselineViewPercentage: 45,
        peers: [],
        missingInformation: ["Native result not verified"],
      },
    ],
  },
};
beforeEach(() => jest.clearAllMocks());
it("explains which video, why now and the frozen analysis period", () => {
  render(<ConnectedAuditReview audit={audit} />);
  expect(screen.getByText("Prepare a native test")).toBeInTheDocument();
  expect(screen.getByText(/2026-09-05 – 2026-10-02/)).toBeInTheDocument();
  expect(
    screen.getByText(/recommendations do not silently change/),
  ).toBeInTheDocument();
  expect(screen.getByText("Current exposure")).toBeInTheDocument();
  expect(screen.getByText("Native result not verified")).toBeInTheDocument();
});
it("shows public fallback and disabled comparison without inventing a diagnosis", () => {
  render(
    <ConnectedAuditReview
      audit={{
        ...audit,
        connectedAnalysis: {
          ...audit.connectedAnalysis,
          comparisonsEnabled: false,
          selectionMode: "public_fallback",
        },
      }}
    />,
  );
  expect(
    screen.getByText(/Comparative analytics are not enabled/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Public sampling was used/)).toBeInTheDocument();
});
it("saves preparation only after persistence succeeds, with visible feedback", async () => {
  (ctrApi.updateAuditExperiment as jest.Mock).mockResolvedValueOnce([
    {
      experimentId: "e1",
      status: "prepared",
      source: "creator_reported",
      updatedAt: "2026-10-03",
      events: [],
    },
  ]);
  render(<AuditExperimentTracker audit={audit} />);
  fireEvent.click(screen.getByText("Destination first"));
  fireEvent.click(screen.getByText("Save test update"));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Saved to this audit"),
  );
  expect(ctrApi.updateAuditExperiment).toHaveBeenCalledWith(42, "e1", {
    status: "prepared",
  });
  expect(screen.getByText(/Results are declared by you/)).toBeInTheDocument();
  expect(document.querySelector("select")).toBeNull();
});
it("shows failure without presenting an unsaved result as recorded", async () => {
  (ctrApi.updateAuditExperiment as jest.Mock).mockRejectedValueOnce(
    Error("offline"),
  );
  render(<AuditExperimentTracker audit={audit} />);
  fireEvent.click(screen.getByText("Destination first"));
  fireEvent.click(screen.getByText("Save test update"));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("not saved"),
  );
  expect(screen.queryByRole("status")).toBeNull();
});
it("restores an inconclusive saved native-test outcome on reopening", () => {
  const row = {
    experimentId: "e1",
    status: "completed",
    result: "inconclusive",
    startDate: "2026-09-01",
    endDate: "2026-09-10",
    note: "No conclusion",
    updatedAt: "2026-09-10",
    source: "creator_reported",
    events: [],
  };
  render(
    <AuditExperimentTracker audit={{ ...audit, experimentTracking: [row] }} />,
  );
  expect(screen.getByText("Inconclusive")).toBeInTheDocument();
  expect(screen.getByLabelText("Actual start date")).toHaveValue("2026-09-01");
  expect(screen.getByLabelText("Test notes")).toHaveValue("No conclusion");
  expect(screen.queryByLabelText("Winning option")).toBeNull();
});
it("supports declaring an equal outcome through the actual custom menus", async () => {
  (ctrApi.updateAuditExperiment as jest.Mock).mockResolvedValueOnce([]);
  render(<AuditExperimentTracker audit={audit} />);
  fireEvent.click(screen.getByText("Destination first"));
  fireEvent.click(screen.getByLabelText("Test status"));
  fireEvent.click(
    await screen.findByRole("option", { name: "Test completed" }),
  );
  fireEvent.click(screen.getByLabelText("Test result"));
  fireEvent.click(
    await screen.findByRole("option", { name: "Options performed the same" }),
  );
  fireEvent.change(screen.getByLabelText("Actual start date"), {
    target: { value: "2026-09-01" },
  });
  fireEvent.change(screen.getByLabelText("Actual end date"), {
    target: { value: "2026-09-10" },
  });
  fireEvent.click(screen.getByText("Save test update"));
  await waitFor(() =>
    expect(ctrApi.updateAuditExperiment).toHaveBeenCalledWith(42, "e1", {
      status: "completed",
      result: "performed_same",
      startDate: "2026-09-01",
      endDate: "2026-09-10",
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Saved to this audit"),
  );
});
