import React, { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BriefReview } from "../studio/BriefReview";
import { thumbnailStudioApi } from "../../../../../api/thumbnailStudio";
import { thumbnailPackagingApi } from "../../../../../api/thumbnailPackaging";
import { AssetInput, AuditCorrectionPicker } from "../studio/StudioControls";
import { StudioOperationPanel } from "../studio/StudioOperationPanel";
import { StudioCreditsScope, StudioPaidAction } from "../studio/StudioPaidAction";
import { studioAssetRefreshDelay } from "../../../../../hooks/useStudioAssets";
import {
  studioProject,
  studioOperation,
} from "../../../../../tests/fixtures/studio";
import { defaultStudioSettings } from "../../../../../types/thumbnailStudio";
import type { StudioAudit } from "../../../../../types/thumbnailStudio";
jest.mock("../../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: { asset: jest.fn(), upload: jest.fn(), assetFromThumbnail: jest.fn() },
  studioError: (e: any) => ({ message: e.message }),
}));
jest.mock("../BuyCreditsModal", () => ({ BuyCreditsModal: ({ isOpen }: any) => (isOpen ? <p>Credit packs</p> : null) }));
jest.mock("../../../../../api/thumbnailPackaging", () => ({ thumbnailPackagingApi: { list: jest.fn(async () => []), remove: jest.fn() } }));
let client: QueryClient;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches: true, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValue([]);
  (thumbnailStudioApi.asset as jest.Mock).mockImplementation(async id => ({ id, kind: "image", url: `https://signed.example/${id}`, originalName: `${id}.png` }));
  (thumbnailStudioApi.upload as jest.Mock).mockResolvedValue({ id: "uploaded-subject", url: "https://signed.example/subject", originalName: "product.png" });
  (thumbnailStudioApi.assetFromThumbnail as jest.Mock).mockResolvedValue({ id: "owned-style", url: "https://signed.example/style", originalName: "Channel style" });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
});
afterEach(() => client.clear());
function Brief() {
  const p = studioProject();
  const [value, setValue] = useState(p.currentRevision.briefInput);
  return (
    <>
      <BriefReview
        value={value}
        revision={p.currentRevision}
        onChange={setValue}
        onBlur={() => undefined}
      />
      <output data-testid="draft">{JSON.stringify(value)}</output>
    </>
  );
}
it("preserves inherited style fields when only one colour is overridden and supports multiline rules", () => {
  render(
    <QueryClientProvider client={client}>
      <Brief />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Primary colour"), {
    target: { value: "#123456" },
  });
  expect(
    JSON.parse(screen.getByTestId("draft").textContent!).styleOverrides,
  ).toEqual({ primaryColor: "#123456" });
  const rules = screen.getByLabelText("Other rules, one per line");
  fireEvent.change(rules, { target: { value: "First rule\nSecond rule\n" } });
  expect(rules).toHaveValue("First rule\nSecond rule\n");
  fireEvent.blur(rules);
  expect(
    JSON.parse(screen.getByTestId("draft").textContent!).overrides.rules
      .additional,
  ).toEqual(["First rule", "Second rule"]);
});
it("uses the original format selector and preserves exact words and rule overrides", () => {
  render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
  expect(screen.getByRole("heading", { name: "What’s your video about?" })).toBeInTheDocument();
  fireEvent.click(screen.getByText("More options"));
  fireEvent.click(screen.getByRole("button", { name: /Short/ }));
  fireEvent.click(screen.getByLabelText("Text on the thumbnail"));
  fireEvent.click(screen.getByRole("option", { name: "Use my exact words" }));
  fireEvent.change(screen.getByLabelText("Initial headline"), { target: { value: "KEEP 2026" } });
  fireEvent.click(screen.getByText("Rules for this video"));
  fireEvent.click(screen.getByLabelText("faces"));
  fireEvent.click(screen.getByRole("option", { name: "Do not include" }));
  const value = JSON.parse(screen.getByTestId("draft").textContent!);
  expect(value.outputFormat).toBe("portrait");
  expect(value.overrides.text).toEqual({ mode: "exact", value: "KEEP 2026" });
  expect(value.overrides.rules.faces).toBe("forbid");
});
it("uploads subjects through Studio and imports a saved style as an owned asset", async () => {
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValue([{ id: 42, name: "Music channel", imageUrl: "/style.png" }]);
  render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
  const file = new File(["image"], "product.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Subject photo"), { target: { files: [file] } });
  await waitFor(() => expect(thumbnailStudioApi.upload).toHaveBeenCalledWith(file, "subject"));
  await waitFor(() => expect(JSON.parse(screen.getByTestId("draft").textContent!).subjectAssetIds).toEqual(["uploaded-subject"]));
  expect(screen.getByText("Added to this thumbnail")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Saved subject reference 1" })).toHaveAttribute("src", "https://signed.example/subject");
  await waitFor(() => expect(screen.getByRole("button", { name: "Music channel" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Music channel" }));
  await waitFor(() => expect(thumbnailStudioApi.assetFromThumbnail).toHaveBeenCalledWith(42));
  await waitFor(() => expect(JSON.parse(screen.getByTestId("draft").textContent!).overrides.styleAssetId).toBe("owned-style"));
});

it("explains when no profile style exists instead of offering a no-op button", () => {
  render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
  expect(screen.queryByRole("button", { name: "Use profile style reference" })).not.toBeInTheDocument();
  expect(screen.getByText(/No channel profile is selected/)).toBeInTheDocument();
});

it("restores an available profile style and shows the selected image", async () => {
  const project = studioProject();
  project.currentRevision.profileSnapshot = { id: "profile", version: 2, name: "My channel", settings: { ...defaultStudioSettings(), styleAssetId: "profile-style" } };
  project.currentRevision.briefInput.overrides.styleAssetId = "custom-style";
  function ProfileBrief() {
    const [value, setValue] = useState(project.currentRevision.briefInput);
    return <><BriefReview value={value} revision={project.currentRevision} onChange={setValue} onBlur={() => undefined} /><output data-testid="profile-draft">{JSON.stringify(value)}</output></>;
  }
  render(<QueryClientProvider client={client}><ProfileBrief /></QueryClientProvider>);
  expect(await screen.findByRole("img", { name: "Selected style reference" })).toHaveAttribute("src", "https://signed.example/custom-style");
  fireEvent.click(screen.getByRole("button", { name: "Use profile style reference" }));
  expect(JSON.parse(screen.getByTestId("profile-draft").textContent!).overrides).not.toHaveProperty("styleAssetId");
  expect(await screen.findByRole("img", { name: "Selected style reference" })).toHaveAttribute("src", "https://signed.example/profile-style");
  expect(screen.getByText("From My channel")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Using profile style reference" })).toBeDisabled();
});

it("keeps a valid logo preview when a different reference cannot be loaded", async () => {
  const project = studioProject();
  project.currentRevision.profileSnapshot = { id: "profile", version: 2, name: "My channel", settings: { ...defaultStudioSettings(), logoAssetId: "profile-logo", styleAssetId: "broken-style" } };
  (thumbnailStudioApi.asset as jest.Mock).mockImplementation(async id => {
    if (id === "broken-style") throw new Error("Style preview unavailable");
    return { id, kind: "image", url: `https://signed.example/${id}`, originalName: `${id}.png` };
  });
  render(<QueryClientProvider client={client}><BriefReview value={project.currentRevision.briefInput} revision={project.currentRevision} onChange={jest.fn()} onBlur={() => undefined} /></QueryClientProvider>);
  expect(await screen.findByRole("img", { name: "Saved channel logo" })).toHaveAttribute("src", "https://signed.example/profile-logo");
  expect(screen.getByText(/One reference preview could not be loaded/)).toBeInTheDocument();
});

it("uploads a style image from the custom file control", async () => {
  (thumbnailStudioApi.upload as jest.Mock).mockResolvedValue({ id: "uploaded-style", kind: "image", url: "https://signed.example/style", originalName: "style.png" });
  render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
  fireEvent.click(screen.getByText("Use another style image"));
  const input = screen.getByLabelText("Style reference") as HTMLInputElement;
  expect(input).toHaveAttribute("type", "file");
  const file = new File(["image"], "style.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(thumbnailStudioApi.upload).toHaveBeenCalledWith(file, "style"));
  await waitFor(() => expect(JSON.parse(screen.getByTestId("draft").textContent!).overrides.styleAssetId).toBe("uploaded-style"));
  expect(screen.getAllByText("Added to this thumbnail").length).toBeGreaterThan(0);
  expect(screen.getByRole("img", { name: "Style reference preview" })).toBeInTheDocument();
});

it("asks for an excerpt when a script is too large, before and after sending it", async () => {
  const onChange = jest.fn();
  render(<QueryClientProvider client={client}><AssetInput label="Upload your script or subtitles" purpose="script" onChange={onChange} /></QueryClientProvider>);
  const input = screen.getByLabelText("Upload your script or subtitles");
  const big = new File(["x"], "talk.srt", { type: "text/plain" });
  Object.defineProperty(big, "size", { value: 1024 * 1024 + 1 });
  fireEvent.change(input, { target: { files: [big] } });
  expect(await screen.findByRole("alert")).toHaveTextContent("This script is over 1 MB. Paste an excerpt instead.");
  expect(thumbnailStudioApi.upload).not.toHaveBeenCalled();
  // Under 1 MiB, the server's only size refusal of a script is its character limit (413).
  (thumbnailStudioApi.upload as jest.Mock).mockRejectedValueOnce({ response: { status: 413, data: { error: { code: "FILE_TOO_LARGE", message: "Provide an excerpt of at most 100,000 characters" } } } });
  const long = new File(["x".repeat(200)], "long.txt", { type: "text/plain" });
  fireEvent.change(input, { target: { files: [long] } });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("This script is over 100,000 characters. Paste an excerpt instead."));
  expect(onChange).not.toHaveBeenCalled();
});

it("shows an uploaded face reference and its filename", async () => {
  (thumbnailStudioApi.upload as jest.Mock).mockResolvedValue({ id: "uploaded-face", kind: "image", url: "https://signed.example/face", originalName: "my-face.png" });
  render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
  fireEvent.click(screen.getByText("Your face reference"));
  const file = new File(["image"], "my-face.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Your face"), { target: { files: [file] } });
  await waitFor(() => expect(thumbnailStudioApi.upload).toHaveBeenCalledWith(file, "face"));
  expect(await screen.findByText("my-face.png")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Your face preview" })).toBeInTheDocument();
});

it("shows inherited saved references and restores inheritance after explicitly removing a logo", async () => {
  const project = studioProject();
  project.currentRevision.profileSnapshot = { id: "profile", version: 2, name: "My channel", settings: { ...defaultStudioSettings(), logoAssetId: "profile-logo" } };
  function InheritedBrief() {
    const [value, setValue] = useState(project.currentRevision.briefInput);
    return <><BriefReview value={value} revision={project.currentRevision} onChange={setValue} onBlur={() => undefined} /><output data-testid="inherited-draft">{JSON.stringify(value)}</output></>;
  }
  render(<QueryClientProvider client={client}><InheritedBrief /></QueryClientProvider>);
  expect(await screen.findByRole("img", { name: "Saved channel logo" })).toHaveAttribute("src", "https://signed.example/profile-logo");
  fireEvent.click(screen.getByRole("button", { name: "Remove logo" }));
  expect(JSON.parse(screen.getByTestId("inherited-draft").textContent!).overrides.logoAssetId).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Use profile logo" }));
  expect(JSON.parse(screen.getByTestId("inherited-draft").textContent!).overrides).not.toHaveProperty("logoAssetId");
  expect(await screen.findByRole("img", { name: "Saved channel logo" })).toBeInTheDocument();
});

it("shows logo upload progress and a preview once the asset is saved", async () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:logo-test");
  URL.revokeObjectURL = jest.fn();
  const images: Array<{ onload: () => void; naturalWidth: number; naturalHeight: number; src: string }> = [];
  const imageSpy = jest.spyOn(window, "Image").mockImplementation(() => {
    const image = { naturalWidth: 300, naturalHeight: 150, src: "", onload: () => undefined, onerror: () => undefined };
    images.push(image);
    return image as unknown as HTMLImageElement;
  });
  let finishUpload!: (asset: object) => void;
  (thumbnailStudioApi.upload as jest.Mock).mockImplementation(() => new Promise(resolve => { finishUpload = resolve; }));
  try {
    render(<QueryClientProvider client={client}><Brief /></QueryClientProvider>);
    const file = new File(["logo"], "channel-logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Channel logo file"), { target: { files: [file] } });
    expect(screen.getByText("Checking image…")).toBeInTheDocument();
    await act(async () => images[0].onload());
    expect(screen.getByText("Uploading logo…")).toBeInTheDocument();
    expect(screen.getByText("channel-logo.png")).toBeInTheDocument();
    await act(async () => finishUpload({ id: "uploaded-logo", kind: "image", url: "https://signed.example/logo", originalName: "channel-logo.png" }));
    expect(await screen.findByRole("img", { name: "Saved channel logo" })).toBeInTheDocument();
    expect(screen.getByText("Logo added to this thumbnail")).toBeInTheDocument();
  } finally {
    imageSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

const audit: StudioAudit = {
  id: "audit",
  projectId: "project",
  revisionId: "revision-one",
  versionId: "version-one",
  operationItemId: "item",
  createdAt: "2026-09-26T10:00:00Z",
  result: {
    schemaVersion: 1,
    versionId: "version-one",
    revisionId: "revision-one",
    strengths: ["Keep the subject"],
    limitations: ["Visual analysis only"],
    findings: [
      {
        id: "finding-one",
        category: "readability",
        severity: "must_fix",
        observation: "Text is small",
        creatorImpact: "Hard to read at phone size",
        proposedChange: "Make text larger",
        preserve: ["the subject"],
        evidence: "visible",
        editable: true,
      },
    ],
  },
};
it("sends only explicitly selected findings and blocks corrections after the brief changes", () => {
  const apply = jest.fn();
  const { rerender } = render(
    <AuditCorrectionPicker
      audit={audit}
      revisionId="revision-one"
      versionId="version-one"
      editCredits={18}
      onApply={apply}
    />,
  );
  expect(screen.getByRole("button", { name: "Apply corrections · 18 credits" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Apply 1 correction · 18 credits" }),
  );
  expect(apply).toHaveBeenCalledWith(
    "Make text larger Preserve: the subject.",
    ["finding-one"],
  );
  rerender(
    <AuditCorrectionPicker
      audit={audit}
      revisionId="revision-two"
      versionId="version-one"
      editCredits={18}
      onApply={apply}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Apply 1 correction · 18 credits" }),
  ).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("older instructions");
});
it("hands the correction to the page's one-click button and clears the selection once it started", async () => {
  const apply = jest.fn(async () => ({ id: "started" }));
  render(
    <AuditCorrectionPicker
      audit={audit}
      revisionId="revision-one"
      versionId="version-one"
      onApply={apply}
      renderAction={(action) => (
        <>
          <p>{`Summary: ${action.instruction}`}</p>
          <button type="button" disabled={action.disabled} onClick={action.run}>{`${action.label} · 18 credits`}</button>
        </>
      )}
    />,
  );
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("Summary: Make text larger Preserve: the subject.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Apply 1 correction · 18 credits" }));
  expect(apply).toHaveBeenCalledWith("Make text larger Preserve: the subject.", ["finding-one"]);
  await waitFor(() => expect(screen.getByRole("checkbox")).not.toBeChecked());
});
it("shows partial results and retries only a failed item, never a quote", () => {
  const op = studioOperation({
    state: "partial",
    startedAt: "2026-09-26T10:00:00Z",
    capturedCredits: 18,
    releasedCredits: 18,
  });
  op.items = [
    {
      ...op.items[0],
      state: "succeeded",
      actualCredits: 18,
      artifact: { kind: "version", versionId: "ready" },
    },
    {
      ...op.items[0],
      id: "failed-item",
      state: "failed",
      retryable: true,
      retryMode: "identical_item",
      errorCode: "PROVIDER_ERROR",
    },
  ];
  const retry = jest.fn();
  render(<StudioOperationPanel operation={op} onRetry={retry} busy={false} />);
  expect(screen.getByText("18 charged · 18 released")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledWith(op.items[1]);
  expect(screen.queryByText(/price/i)).not.toBeInTheDocument();
});
it("renders the page's one-click Retry with its price for a failed output", () => {
  const op = studioOperation({ state: "failed", startedAt: "2026-09-26T10:00:00Z" });
  op.items = [{ ...op.items[0], state: "failed", retryable: true, retryMode: "identical_item" }];
  render(<StudioOperationPanel operation={op} busy={false} renderRetry={(item) => <button type="button">{`Retry ${item.id} · 15 credits`}</button>} />);
  expect(screen.getByRole("button", { name: "Retry item-one · 15 credits" })).toBeInTheDocument();
});

it("says when the image service was not reached: nothing created, credits released, retry", () => {
  const op = studioOperation({ state: "failed", startedAt: "2026-09-26T10:00:00Z", capturedCredits: 0, releasedCredits: 18 });
  op.items = [{ ...op.items[0], state: "failed", retryable: true, retryMode: "identical_item", errorCode: "PROVIDER_NOT_REACHED" }];
  const retry = jest.fn();
  const view = render(<StudioOperationPanel operation={op} onRetry={retry} busy={false} />);
  expect(screen.getByText(/could not be reached, so nothing was created and the credits for this result were released. You can retry it\.$/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledWith(op.items[0]);
  op.items = [{ ...op.items[0], errorCode: "GENERATION_DECLINED" }];
  view.rerender(<StudioOperationPanel operation={op} onRetry={retry} busy={false} />);
  expect(screen.getByText("This result could not be completed. Other ready results are kept.")).toBeInTheDocument();
});

it("does not call an unsettled or unknown outcome a failure", () => {
  const op = studioOperation({ state: "running", startedAt: "2026-09-26T10:00:00Z" });
  op.items[0] = {
    ...op.items[0],
    state: "finalizing",
    errorCode: "SETTLEMENT_PENDING",
  };
  const view = render(
    <StudioOperationPanel operation={op} onRetry={jest.fn()} busy={false} />,
  );
  expect(screen.getByText(/Saving result/)).toBeInTheDocument();
  expect(screen.queryByText(/could not be completed/)).not.toBeInTheDocument();
  op.items[0] = {
    ...op.items[0],
    state: "outcome_unknown",
    errorCode: "OUTCOME_UNKNOWN",
  };
  view.rerender(
    <StudioOperationPanel operation={op} onRetry={jest.fn()} busy={false} />,
  );
  expect(
    screen.getByText(/We are looking for the original result/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/could not be completed/)).not.toBeInTheDocument();
});

describe("one-click priced button", () => {
  const button = (props: Partial<React.ComponentProps<typeof StudioPaidAction>> = {}) => (
    <StudioPaidAction label="Generate 2 concepts" credits={30} onRun={jest.fn()} {...props} />
  );
  it("shows the price on the button and runs in one click", () => {
    const run = jest.fn();
    render(button({ onRun: run }));
    fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("reads free work as free", () => {
    render(button({ label: "Apply text", credits: 0 }));
    expect(screen.getByRole("button", { name: "Apply text · free" })).toBeEnabled();
  });
  it("disables the button when the balance is short, offers credits and re-enables once it covers the price", () => {
    const run = jest.fn();
    const view = render(button({ onRun: run, availableCredits: 5 }));
    expect(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Not enough credits — you have 5");
    fireEvent.click(screen.getByRole("button", { name: "Buy credits" }));
    expect(screen.getByText("Credit packs")).toBeInTheDocument();
    view.rerender(button({ onRun: run, availableCredits: 50 }));
    expect(screen.queryByText(/Not enough credits/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("explains a 402 from the start with Buy credits, without a balance it contradicts", () => {
    render(button({ availableCredits: 100, state: { problem: { kind: "credits", message: "You do not have enough credits for this." } } }));
    expect(screen.getByRole("alert")).toHaveTextContent(/^Not enough credits/);
    expect(screen.getByRole("alert")).not.toHaveTextContent("you have 100");
    fireEvent.click(screen.getByRole("button", { name: "Buy credits" }));
    expect(screen.getByText("Credit packs")).toBeInTheDocument();
  });
  it("shows one notice for a whole tool area, whatever the number of short buttons, and none once covered", () => {
    const area = (available: number) => (
      <StudioCreditsScope availableCredits={available}>
        <StudioPaidAction label="Apply edit" credits={18} availableCredits={available} onRun={jest.fn()} />
        <StudioPaidAction label="Update text" credits={18} availableCredits={available} onRun={jest.fn()} />
        <StudioPaidAction label="Audit this version" credits={2} availableCredits={available} onRun={jest.fn()} />
      </StudioCreditsScope>
    );
    const view = render(area(5));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Not enough credits — you have 5");
    // Each short button stays disabled with its price; the affordable one works.
    expect(screen.getByRole("button", { name: "Apply edit · 18 credits" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Update text · 18 credits" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Audit this version · 2 credits" })).toBeEnabled();
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Buy credits" }));
    expect(screen.getByText("Credit packs")).toBeInTheDocument();
    view.rerender(area(40));
    expect(screen.queryByText(/Not enough credits/)).not.toBeInTheDocument();
  });
  it("keeps saved work visible and the button disabled while starts are paused", () => {
    render(button({ unavailable: "Starting new work is paused for now. Your work is saved; try again later." }));
    expect(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/paused for now/);
  });
  it("asks once when the price changed, and starts on that click", () => {
    const confirm = jest.fn();
    render(button({ state: { priceChange: { credits: 32 } }, onConfirm: confirm, confirmLabel: "Generate" }));
    expect(screen.getByRole("status")).toHaveTextContent("The price is now 32 credits —");
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });
  it("adds the HTTP status and code to a refusal only in development", () => {
    const env = process.env.NODE_ENV;
    const problem = { kind: "other" as const, message: "The Studio could not answer just now.", code: "STUDIO_UNAVAILABLE", status: 503 };
    const view = render(button({ state: { problem } }));
    expect(screen.getByRole("alert")).toHaveTextContent(/^The Studio could not answer just now\.$/);
    view.unmount();
    try {
      (process.env as { NODE_ENV?: string }).NODE_ENV = "development";
      render(button({ state: { problem } }));
      expect(screen.getByRole("alert")).toHaveTextContent("The Studio could not answer just now.(HTTP 503 · STUDIO_UNAVAILABLE)");
    } finally {
      (process.env as { NODE_ENV?: string }).NODE_ENV = env;
    }
  });
  it("says it is starting while its click is handled", () => {
    render(button({ working: true }));
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled();
  });
});
it("renews a reference preview's signed URL before it expires", async () => {
  jest.useFakeTimers();
  try {
    const project = studioProject();
    project.currentRevision.profileSnapshot = { id: "profile", version: 2, name: "My channel", settings: { ...defaultStudioSettings(), logoAssetId: "profile-logo" } };
    let version = 0;
    (thumbnailStudioApi.asset as jest.Mock).mockImplementation(async id => ({ id, kind: "image", url: `https://signed.example/${id}?v=${++version}`, originalName: `${id}.png`, urlExpiresAt: new Date(Date.now() + 75_000).toISOString() }));
    render(<QueryClientProvider client={client}><BriefReview value={project.currentRevision.briefInput} revision={project.currentRevision} onChange={jest.fn()} onBlur={() => undefined} /></QueryClientProvider>);
    expect(await screen.findByRole("img", { name: "Saved channel logo" })).toHaveAttribute("src", "https://signed.example/profile-logo?v=1");
    await act(async () => { jest.advanceTimersByTime(16_000); });
    await waitFor(() => expect(screen.getByRole("img", { name: "Saved channel logo" })).toHaveAttribute("src", "https://signed.example/profile-logo?v=2"));
  } finally {
    jest.useRealTimers();
  }
});
it.each([
  ["five minutes", 300_000, 240_000],
  ["ninety seconds", 90_000, 30_000],
  ["an expired URL", -1_000, 15_000],
  ["a long-lived URL", 30 * 24 * 3600_000, 240_000],
])("renews a URL that expires in %s after the right delay", (_label, expiresIn, delay) => {
  const now = Date.parse("2026-09-26T12:00:00Z");
  expect(studioAssetRefreshDelay({ urlExpiresAt: new Date(now + expiresIn).toISOString() } as any, now)).toBe(delay);
  expect(studioAssetRefreshDelay(undefined, now)).toBe(240_000);
});
