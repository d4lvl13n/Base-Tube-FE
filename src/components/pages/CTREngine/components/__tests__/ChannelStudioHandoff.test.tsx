import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChannelStudioHandoff } from "../studio/ChannelStudioHandoff";
import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import { thumbnailStudioApi } from "../../../../../api/thumbnailStudio";
import { studioProject } from "../../../../../tests/fixtures/studio";
import type { ChannelPackagingAuditV2 } from "../../../../../types/ctr";
jest.mock("../../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: jest.fn(),
}));
jest.mock("../../../../../hooks/useStudioOperation", () => ({
  studioStartKey: () => "persistent-handoff-key",
}));
jest.mock("../../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    channelContext: jest.fn(),
    channelProjects: jest.fn(),
    profiles: jest.fn(),
  },
  studioError: (e: any) => ({ message: e.message }),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
const audit = {
  id: 42,
  schemaVersion: 2,
  mode: "connected",
  perVideo: [
    {
      videoId: "abcdefghijk",
      title: "Real video title",
      metrics: { ctr: 0.15, impressions: 9000 },
    },
  ],
  experiments: [
    {
      id: "exp1",
      title: "Test readable words",
      priority: 1,
      hypothesis: "Private hypothesis",
      videoIds: ["abcdefghijk"],
      variantBrief: { thumbnail: "Private advice", title: "Optional title" },
    },
  ],
} as unknown as ChannelPackagingAuditV2;
function open() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChannelStudioHandoff audit={audit} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  (useStudioAccount as jest.Mock).mockReturnValue("clerk:alice");
  api.profiles.mockResolvedValue({ items: [], nextCursor: null });
  api.channelContext.mockResolvedValue({
    videos: [
      { videoId: "abcdefghijk", format: "unknown", formatSource: "unknown" },
    ],
    eligibleExperiments: [{ experimentId: "exp1", videoIds: ["abcdefghijk"] }],
  });
  api.channelProjects.mockResolvedValue({
    projects: [studioProject()],
    review: [
      {
        projectId: studioProject().id,
        videoId: "abcdefghijk",
        suggestedTitle: null,
        privateRecommendationExcluded: true,
        warnings: ["Private recommendations remain in your report."],
      },
    ],
  });
});
afterEach(() => client.clear());
it("prepares only selected structured IDs and shows private-context exclusion before any image action", async () => {
  open();
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Prepare 1 project · free" }),
  );
  await waitFor(() =>
    expect(api.channelProjects).toHaveBeenCalledWith(
      42,
      { selections: [{ videoId: "abcdefghijk", experimentId: "exp1" }] },
      "persistent-handoff-key",
    ),
  );
  expect(
    await screen.findByText("Private recommendations remain in your report."),
  ).toBeInTheDocument();
  expect(JSON.stringify(api.channelProjects.mock.calls[0])).not.toMatch(
    /ctr|impressions|Private advice|Private hypothesis/,
  );
});
it("keeps an unknown video out of long and Shorts filters without reclassifying from duration", async () => {
  open();
  await screen.findByRole("checkbox");
  fireEvent.click(screen.getByLabelText("Videos to prepare"));
  fireEvent.click(screen.getByRole("option", { name: "Shorts" }));
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(
    screen.getByText("No eligible videos in this format."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Videos to prepare"));
  fireEvent.click(screen.getByRole("option", { name: "Format unknown" }));
  expect(screen.getByRole("checkbox")).toBeInTheDocument();
});
it("makes no companion request for anonymous visitors", () => {
  (useStudioAccount as jest.Mock).mockReturnValue("anonymous");
  const view = open();
  expect(view.container).toBeEmptyDOMElement();
  expect(api.channelContext).not.toHaveBeenCalled();
});
it("offers only the project handoff for an experiment, and nothing to anonymous visitors", () => {
  const { StudioExperimentAction } = require("../studio/ChannelStudioHandoff");
  const view = render(<StudioExperimentAction auditId={42} experiment={audit.experiments[0]} />);
  expect(screen.getByRole("button", { name: "Prepare this experiment in a project" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Generate this variant/ })).not.toBeInTheDocument();
  view.unmount();
  (useStudioAccount as jest.Mock).mockReturnValue("anonymous");
  const anonymous = render(<StudioExperimentAction auditId={42} experiment={audit.experiments[0]} />);
  expect(anonymous.container).toBeEmptyDOMElement();
});
