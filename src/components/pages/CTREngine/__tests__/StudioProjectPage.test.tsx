import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StudioProjectPage from "../StudioProjectPage";
import {
  thumbnailStudioApi,
  downloadStudioBlob,
} from "../../../../api/thumbnailStudio";
import { studioProject, studioOperation, projectId } from "../../../../tests/fixtures/studio";
import { useStudioStartAvailability } from "../../../../hooks/useStudioCapabilities";
import type { StudioOperation, StudioProject, StudioQuoteInput } from "../../../../types/thumbnailStudio";
jest.mock("../../../../api/ctr", () => ({ ctrApi: { applyFinalAdjustments: jest.fn(), auditThumbnail: jest.fn(), getQuota: jest.fn() } }));
jest.mock("../../../../api/thumbnail", () => ({ thumbnailApi: { editThumbnail: jest.fn() } }));
jest.mock("../../../../api/thumbnailPackaging", () => ({ thumbnailPackagingApi: { list: jest.fn().mockResolvedValue([]) } }));
jest.mock("../../../../hooks/useThumbnailGallery", () => ({ downloadGalleryThumbnail: jest.fn() }));
jest.mock("@clerk/clerk-react", () => ({
  SignInButton: ({ children }: any) => children,
}));
jest.mock("../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../../../hooks/useCTREngine", () => ({
  __esModule: true,
  default: () => ({
    isAuthenticated: true,
    isLoadingQuota: false,
    niches: [],
    usageAccess: {
      mode: "credits",
      creditInfo: { balance: 100, reserved: 0, available: 100 },
    },
  }),
}));
let mockCapabilities: { validation: boolean } | undefined;
// The server's catalog: a concept is 15 credits at any quality, an edit 18, an audit 2 (3 with personas).
const catalog = {
  thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 },
  ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept: 15 },
};
jest.mock("../../../../hooks/useStudioCapabilities", () => ({
  useStudioStartAvailability: jest.fn(),
  useStudioPricing: () => catalog,
  useStudioCapabilities: () => ({ data: mockCapabilities }),
  studioStartUnavailableMessage: (reason: string | null) =>
    reason === "paused" ? "Starting new work is paused for now. Your work is saved; try again later." : "Starting new work is temporarily unavailable. Your work is saved; try again in a few minutes.",
}));
jest.mock("../AIThumbnailsLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <main>{children}</main>,
}));
jest.mock("../components/BuyCreditsModal", () => ({ BuyCreditsModal: ({ isOpen }: any) => (isOpen ? <p>Credit packs</p> : null) }));
jest.mock("../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    project: jest.fn(),
    asset: jest.fn(),
    exportVersion: jest.fn(),
    quote: jest.fn(),
    operation: jest.fn(),
    start: jest.fn(),
    patchProject: jest.fn(),
    saveValidationFeedback: jest.fn(),
  },
  downloadStudioBlob: jest.fn(),
  studioError: (e: any) => ({ code: "ERROR", message: e.message }),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
let project: StudioProject;
/** Operations the fake server knows, by ID. */
let operations: Map<string, StudioOperation>;
let sequence = 0;
let keys = 0;
const price = (item: StudioQuoteInput["items"][number]) =>
  item.action === "generate" ? 15 : item.action === "edit" ? 18 : item.action === "audit" ? (item.input.includePersonas ? 3 : 2) : 0;
/** The server's quote: the catalog price of every item. */
function quoteOf(input: StudioQuoteInput, extra = 0): StudioOperation {
  const id = `dddddddd-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  const items = input.items.map((item, i) => ({
    ...studioOperation().items[0],
    ...item,
    id: `${id}-item-${i}`,
    quotedCredits: price(item),
    retryOfItemId: input.retryOfItemId ?? null,
  }));
  const op = studioOperation({ id, items, quotedCredits: items.reduce((sum, item) => sum + item.quotedCredits, 0) + extra });
  operations.set(id, op);
  return op;
}
function startOf(id: string): StudioOperation {
  const op = operations.get(id)!;
  const started = { ...op, state: "running" as const, startedAt: new Date().toISOString(), items: op.items.map((item) => ({ ...item, state: "queued" as const })) };
  operations.set(id, started);
  return started;
}
const credits = (available: number) => ({ mode: "credits", creditInfo: { balance: available, reserved: 0, available }, pricing: null });
beforeEach(() => {
  jest.clearAllMocks();
  mockCapabilities = undefined;
  sequence = 0;
  operations = new Map();
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() });
  require("../../../../api/thumbnailPackaging").thumbnailPackagingApi.list.mockResolvedValue([]);
  require("../../../../api/ctr").ctrApi.getQuota.mockResolvedValue(credits(100));
  localStorage.clear();
  sessionStorage.clear();
  Object.defineProperty(global, "crypto", { configurable: true, value: { randomUUID: () => `33333333-3333-4333-8333-${String(++keys).padStart(12, "0")}` } });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  (useStudioStartAvailability as jest.Mock).mockReturnValue({ available: true, message: null });
  project = studioProject();
  project.versions = [
    {
      id: "version-one",
      projectId,
      revisionId: project.currentRevisionId,
      assetId: "asset-one",
      parentVersionId: null,
      operationItemId: null,
      kind: "import",
      instruction: null,
      editing: null,
      validation: null,
      createdAt: "2026-09-26T10:00:00Z",
      asset: {
        id: "asset-one",
        kind: "image",
        purpose: "source_image",
        originalName: "image.png",
        mime: "image/png",
        byteSize: 100,
        width: 1280,
        height: 720,
        sha256: "hash",
        url: "https://example.com/image.png",
        urlExpiresAt: "2099-01-01T00:00:00Z",
      },
    },
  ];
  api.project.mockResolvedValue(project);
  api.exportVersion.mockResolvedValue(
    new Blob(["image"], { type: "image/png" }),
  );
  api.patchProject.mockImplementation(async (_id, _lock, patch) => {
    const nextRevision = patch.briefInput && JSON.stringify(patch.briefInput) !== JSON.stringify(project.currentRevision.briefInput)
      ? { ...project.currentRevision, id: "revision-two", briefInput: patch.briefInput, brief: { ...project.currentRevision.brief, ...patch.briefInput, ...patch.briefInput.overrides, rules: { ...project.currentRevision.brief.rules, ...patch.briefInput.overrides.rules } } }
      : project.currentRevision;
    project = { ...project, ...patch, currentRevision: nextRevision, currentRevisionId: nextRevision.id, lockVersion: project.lockVersion + 1 };
    return project;
  });
  api.quote.mockImplementation(async (input) => quoteOf(input));
  api.start.mockImplementation(async (id) => startOf(id));
  api.operation.mockImplementation(async (id) => operations.get(id) || studioOperation({ id }));
});
afterEach(() => client.clear());
function app(entry: { search?: string; state?: object } = {}) {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[
          { pathname: `/ai-thumbnails/projects/${projectId}`, ...entry },
        ]}
      >
        <Routes>
          <Route
            path="/ai-thumbnails/projects/:projectId"
            element={<StudioProjectPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
function open(entry: { search?: string; state?: object } = {}) { return render(app(entry)); }
const work = () => screen.getByLabelText("Ongoing work and results");
const storedKey = (id: string) => JSON.parse(localStorage.getItem("thumbnail-studio:start:v1:" + id)!).key;
async function describeBackgroundEdit(refine: HTMLElement) {
  fireEvent.click(refine);
  fireEvent.click(screen.getByRole("tab", { name: "Change something" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit target" }));
  fireEvent.click(screen.getByRole("option", { name: "Background" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Edit instruction" }), { target: { value: "Use a dark blue background" } });
}
/** The one "Not enough credits" notice of the tool area on screen. */
const creditsNotice = () => screen.getAllByRole("alert").find((alert) => alert.textContent?.startsWith("Not enough credits"));
it("keeps projects readable and exportable while starts are paused, with Generate disabled and no paid call", async () => {
  (useStudioStartAvailability as jest.Mock).mockReturnValue({ available: false, message: "Starting new work is paused for now. Your work is saved; try again later." });
  open();
  expect(await screen.findByRole("button", { name: "2. Choose" })).toBeInTheDocument();
  fireEvent.click(screen.getByText("Compare at YouTube size"));
  fireEvent.click(screen.getByLabelText("Preview size"));
  fireEvent.click(screen.getByRole("option", { name: "160 px" }));
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  await waitFor(() =>
    expect(api.exportVersion).toHaveBeenCalledWith(
      "version-one",
      "png",
      "original",
    ),
  );
  await waitFor(() => expect(downloadStudioBlob).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "1. Brief" }));
  const generate = screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" });
  expect(generate).toBeDisabled();
  fireEvent.click(generate);
  expect(screen.getAllByText(/Starting new work is paused for now/).length).toBeGreaterThan(0);
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("persists an explicit image choice without automatically auditing or generating", async () => {
  open();
  await screen.findByRole("button", { name: "2. Choose" });
  fireEvent.click(screen.getByRole("button", { name: "Keep this version" }));
  await waitFor(() =>
    expect(api.patchProject).toHaveBeenCalledWith(
      projectId,
      1,
      expect.objectContaining({ selectedVersionId: "version-one" }),
    ),
  );
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("restores a chosen version even when it is outside the first history page", async () => {
  project.selectedVersion = {
    ...project.versions[0],
    id: "older-selected",
    createdAt: "2026-09-25T10:00:00Z",
  };
  project.selectedVersionId = "older-selected";
  open();
  expect(
    await screen.findByRole("button", { name: "Selected version" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "3. Refine" }));
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  await waitFor(() =>
    expect(api.exportVersion).toHaveBeenCalledWith(
      "older-selected",
      "png",
      "original",
    ),
  );
});
it("saves and reloads warning feedback during a rollout pause without blocking selection or export", async () => {
  project.versions[0].validation = {
    schemaVersion: 1,
    status: "checked",
    validatorVersion: "test",
    observedText: [],
    checks: [
      {
        code: "forbidden_logo",
        status: "warning",
        explanation: "A logo may be visible.",
      },
    ],
  };
  project.versions[0].validationFeedback = [];
  let finish!: () => void;
  api.saveValidationFeedback.mockImplementationOnce(
    async (versionId, input) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      project.versions[0].validationFeedback = [
        {
          ...input,
          createdAt: "2026-09-26T12:00:00Z",
          updatedAt: "2026-09-26T12:00:00Z",
        },
      ];
      return {
        versionId,
        validationFeedback: project.versions[0].validationFeedback,
      };
    },
  );
  const view = open();
  const buttons = await screen.findAllByRole("button", {
    name: "Not an issue",
  });
  fireEvent.click(buttons[0]);
  await waitFor(() =>
    expect(api.saveValidationFeedback).toHaveBeenCalledTimes(1),
  );
  expect(
    screen.getByRole("button", { name: "Keep this version" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  await waitFor(() => expect(api.exportVersion).toHaveBeenCalled());
  finish();
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: "Not an issue" })[0],
    ).toHaveAttribute("aria-pressed", "true"),
  );
  view.unmount();
  client.clear();
  open();
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: "Not an issue" })[0],
    ).toHaveAttribute("aria-pressed", "true"),
  );
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it.each([
  ["youtube", "YouTube link"],
  ["image", "Existing image"],
] as const)(
  "opens the selected %s source directly without running a provider",
  async (source, label) => {
    open({ search: `?source=${source}` });
    await screen.findByRole("button", { name: "2. Choose" });
    expect(screen.getByRole("radio", { name: label })).toBeChecked();
    if (source === "youtube")
      expect(screen.getByLabelText("Video link")).toBeInTheDocument();
    else
      expect(
        screen.getByLabelText("Upload an existing thumbnail"),
      ).toBeInTheDocument();
    expect(api.quote).not.toHaveBeenCalled();
    expect(api.start).not.toHaveBeenCalled();
  },
);
it("restores the create form's concept count and quality without starting anything", async () => {
  open({ state: { studioEntry: { conceptCount: 3, quality: "standard" } } });
  await screen.findByRole("button", { name: "2. Choose" });
  expect(screen.getByLabelText("Quality")).toHaveTextContent("Standard");
  expect(
    screen.getByRole("button", { name: "Generate 3 concepts · 45 credits" }),
  ).toBeEnabled();
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("generates in one click: quotes at the price on the button, stores the key, starts and shows the running work", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.quote.mock.calls[0][0].items).toEqual([0, 1].map((index) => ({
    projectId,
    revisionId: "revision-one",
    action: "generate",
    input: { conceptIndex: index, conceptCount: 2, quality: "high" },
  })));
  const [id, key] = api.start.mock.calls[0];
  expect(key).toBe(storedKey(id));
  expect(await within(work()).findByRole("heading", { name: "In progress" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "2. Choose" })).toHaveAttribute("aria-current", "step");
  expect(screen.queryByText(/price ready|get a new price|confirm and start/i)).not.toBeInTheDocument();
});
it("handles a double click on Generate once: one quote, one start", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  const generate = screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" });
  fireEvent.click(generate);
  fireEvent.click(generate);
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  await within(work()).findByRole("heading", { name: "In progress" });
  expect(api.quote).toHaveBeenCalledTimes(1);
});
it("asks once when the quote's price differs from the button: 'The price is now X credits — Generate'", async () => {
  api.quote.mockImplementation(async (input) => quoteOf(input, 2));
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  expect((await screen.findAllByText(/The price is now 32 credits —/)).length).toBeGreaterThan(0);
  expect(api.start).not.toHaveBeenCalled();
  const brief = screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }).parentElement!;
  fireEvent.click(within(brief).getByRole("button", { name: "Generate" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledTimes(1);
  const quoted = await api.quote.mock.results[0].value;
  expect(api.start.mock.calls[0][0]).toBe(quoted.id);
  await waitFor(() => expect(screen.queryByText(/The price is now/)).not.toBeInTheDocument());
});
it("disables Generate when the shared balance is short, says so once for the brief with Buy credits, and enables it once the balance covers the price", async () => {
  const ctr = require("../../../../api/ctr").ctrApi;
  ctr.getQuota.mockResolvedValue(credits(5));
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled());
  const notice = creditsNotice()!;
  expect(notice).toHaveTextContent("Not enough credits — you have 5");
  expect(screen.getAllByRole("alert").filter((alert) => alert.textContent?.startsWith("Not enough credits"))).toHaveLength(1);
  fireEvent.click(within(notice).getByRole("button", { name: "Buy credits" }));
  expect(screen.getByText("Credit packs")).toBeInTheDocument();
  ctr.getQuota.mockResolvedValue(credits(50));
  await act(async () => { require("../../../../hooks/useStudioBalance").notifyStudioUsageChanged(); });
  await waitFor(() => expect(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeEnabled());
  await waitFor(() => expect(creditsNotice()).toBeUndefined());
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("explains a 402 on start once for the tool area, with Buy credits", async () => {
  api.start.mockRejectedValue({ response: { status: 402, data: { error: { code: "INSUFFICIENT_CREDITS", message: "You do not have enough available credits." } } } });
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await waitFor(() => expect(creditsNotice()).toBeDefined());
  expect(within(creditsNotice()!).getByRole("button", { name: "Buy credits" })).toBeInTheDocument();
  expect(api.start).toHaveBeenCalledTimes(1);
});
it("prices and starts the same work once more when the brief changed, inside the same click", async () => {
  api.start
    .mockRejectedValueOnce({ response: { status: 409, data: { error: { code: "BRIEF_CHANGED", message: "The brief changed. Review a new quote." } } } })
    .mockImplementation(async (id) => startOf(id));
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(2));
  expect(api.quote).toHaveBeenCalledTimes(2);
  expect(api.quote.mock.calls[1][0].items).toEqual(api.quote.mock.calls[0][0].items);
  expect(api.start.mock.calls[1][0]).not.toBe(api.start.mock.calls[0][0]);
  expect(await within(work()).findByRole("heading", { name: "In progress" })).toBeInTheDocument();
  expect(screen.queryByText(/Couldn't start/)).not.toBeInTheDocument();
});
it("shows a plain error when the new attempt is refused too", async () => {
  api.start.mockRejectedValue({ response: { status: 409, data: { error: { code: "QUOTE_EXPIRED", message: "Request a new quote." } } } });
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  expect((await screen.findAllByText("Couldn't start — try again.")).length).toBeGreaterThan(0);
  expect(api.start).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/quote|new price|price ready|confirm and start/i)).not.toBeInTheDocument();
});
it("works on a hidden (archived) project: no Archive button, an autosave indicator, and Generate starts", async () => {
  project.archived = true;
  open();
  await screen.findByRole("button", { name: "2. Choose" });
  expect(screen.getByText("All changes saved")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /archive/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/Unarchive/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "1. Brief" }));
  expect(screen.getByLabelText(/Video title or idea/)).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  // The start restores it on the server; the project is read again.
  await waitFor(() => expect(api.project.mock.calls.length).toBeGreaterThan(1));
});
it("shows Saving… then All changes saved while the brief autosaves", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "A sharper video" } });
  expect(screen.getByText("Changes waiting to save")).toBeInTheDocument();
  fireEvent.blur(screen.getByLabelText(/Video title or idea/));
  await waitFor(() => expect(api.patchProject).toHaveBeenCalled());
  expect(await screen.findByText("All changes saved")).toBeInTheDocument();
});
it("starts a Studio edit in one click, with what changes and what is kept right above the priced button", async () => {
  project.currentRevision.brief = { ...project.currentRevision.brief, text: { mode: "exact", value: "BEST CAMERA?" }, logoAssetId: "logo-1", rules: { faces: "forbid", logos: "allow", prices: "forbid", additional: ["Keep the red strap"] } };
  open();
  await describeBackgroundEdit(await screen.findByRole("button", { name: "Refine" }));
  // Before the click: the summary sits above "Apply edit · 18 credits", under the large image.
  const button = screen.getByRole("button", { name: "Apply edit · 18 credits" });
  const block = button.parentElement!;
  expect(block.closest(".studio-refine")).not.toBeNull();
  const review = within(block);
  expect(review.getByText("What changes")).toBeInTheDocument();
  expect(review.getByText("Use a dark blue background")).toBeInTheDocument();
  expect(review.getByText(/The subject, its expression and position/)).toBeInTheDocument();
  expect(review.getByText(/Exact text: “BEST CAMERA\?”/)).toBeInTheDocument();
  expect(review.getByText(/Your logo/)).toBeInTheDocument();
  expect(review.getByText(/Not added: faces, prices/)).toBeInTheDocument();
  expect(review.getByText(/Keep the red strap/)).toBeInTheDocument();
  expect(api.quote).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledWith({ items: [expect.objectContaining({ action: "edit", revisionId: "revision-one", input: expect.objectContaining({ sourceVersionId: "version-one", instruction: expect.stringContaining("dark blue") }) })] });
  expect(require("../../../../api/thumbnail").thumbnailApi.editThumbnail).not.toHaveBeenCalled();
  // The running edit shows next to its image, with what it changes.
  const running = await screen.findByRole("region", { name: "Studio operation" });
  expect(running.closest(".studio-refine")).not.toBeNull();
  expect(within(running).getByText("In progress")).toBeInTheDocument();
  expect(within(running).getByText("Use a dark blue background")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Edit instruction" })).toHaveValue(""));
});
it("saves the replacement headline into the brief before quoting the edit", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Refine" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Headline", exact: true }), { target: { value: "EXACT NEW WORDS" } });
  expect(screen.getByText("Replace the headline with “EXACT NEW WORDS”.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Update text · 18 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledWith({ items: [expect.objectContaining({ action: "edit", revisionId: "revision-two", input: expect.objectContaining({ sourceVersionId: "version-one" }) })] });
  expect(api.patchProject).toHaveBeenCalledWith(projectId, 1, expect.objectContaining({ briefInput: expect.objectContaining({ overrides: expect.objectContaining({ text: { mode: "exact", value: "EXACT NEW WORDS" } }) }) }));
  expect(api.patchProject.mock.invocationCallOrder[0]).toBeLessThan(api.quote.mock.invocationCallOrder[0]);
});
it("applies a text change for free in one click", async () => {
  project.versions[0].editing = { baseThumbnailId: 7, baseImageUrl: "clean-base", textPlan: { headline: "Old words", zone: "bottom" }, textStyle: { font: "DejaVu Sans", color: "#FFFFFF", fontScale: 1, stroke: true } };
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Refine" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Headline", exact: true }), { target: { value: "New words" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply text · free" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledWith({ items: [expect.objectContaining({ action: "overlay", input: { sourceVersionId: "version-one", text: "New words" } })] });
});
it("refines the chosen version large, with the tools as tabs under it and Download and Keep beside them, without helper text", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Refine" }));
  const refine = screen.getByRole("region", { name: "Refine this version" });
  expect(within(refine).getByRole("img", { name: "Version 1" })).toBeInTheDocument();
  const tabs = within(refine).getAllByRole("tab").map((tab) => tab.textContent);
  expect(tabs).toEqual(["Text", "Change something", "Audit"]);
  expect(within(refine).getByRole("tab", { name: "Text" })).toHaveAttribute("aria-selected", "true");
  expect(within(refine).getByRole("button", { name: "Download" })).toBeInTheDocument();
  expect(within(refine).getByRole("button", { name: "Keep this version" })).toBeInTheDocument();
  // A typed change survives switching tabs.
  fireEvent.click(within(refine).getByRole("tab", { name: "Change something" }));
  fireEvent.change(within(refine).getByRole("textbox", { name: "Edit instruction" }), { target: { value: "Brighter face" } });
  fireEvent.click(within(refine).getByRole("tab", { name: "Audit" }));
  expect(within(refine).getByRole("button", { name: "Audit this version · 2 credits" })).toBeInTheDocument();
  fireEvent.click(within(refine).getByRole("tab", { name: "Change something" }));
  expect(within(refine).getByRole("textbox", { name: "Edit instruction" })).toHaveValue("Brighter face");
  expect(screen.queryByText(/Each button shows its price|Uses AI image editing|Review the result before using it|Previous versions remain available/)).not.toBeInTheDocument();
  // The automatic check did not run on this version: nothing is said about it.
  expect(screen.queryByText(/Automatic check/)).not.toBeInTheDocument();
  fireEvent.click(within(refine).getByRole("button", { name: "Keep this version" }));
  await waitFor(() => expect(api.patchProject).toHaveBeenCalledWith(projectId, 1, expect.objectContaining({ selectedVersionId: "version-one" })));
  expect(api.quote).not.toHaveBeenCalled();
});
it("says nothing about the automatic check when it is turned off, and one short line when it ran but could not check", async () => {
  project.versions[0].validation = { schemaVersion: 1, status: "unavailable", validatorVersion: "test", observedText: [], checks: [] };
  mockCapabilities = { validation: false };
  const view = open();
  await screen.findByRole("button", { name: "2. Choose" });
  expect(screen.queryByText(/Automatic check/)).not.toBeInTheDocument();
  view.unmount();
  client.clear();
  mockCapabilities = { validation: true };
  open();
  expect((await screen.findAllByText("Automatic check unavailable for this image.")).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Check the text and your rules before using this image/)).not.toBeInTheDocument();
});
it("keeps a running edit in the list with a way back to its version when the version leaves the screen", async () => {
  open();
  await describeBackgroundEdit(await screen.findByRole("button", { name: "Refine" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply edit · 18 credits" }));
  const running = await screen.findByRole("region", { name: "Studio operation" });
  expect(running.closest(".studio-refine")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "1. Brief" }));
  expect(within(work()).getByText("Use a dark blue background")).toBeInTheDocument();
  fireEvent.click(within(work()).getByRole("button", { name: "Open Version 1 to follow this edit next to it" }));
  const back = await screen.findByRole("region", { name: "Studio operation" });
  expect(back.closest(".studio-refine")).not.toBeNull();
  await waitFor(() => expect(within(back).getByRole("heading", { name: "In progress" })).toHaveFocus());
  expect(api.start).toHaveBeenCalledTimes(1);
});
it("rebuilds a running edit's change from its request when it started in another tab", async () => {
  const id = "dddddddd-0000-4000-8000-000000000099";
  operations.set(id, studioOperation({ id, state: "running", startedAt: "2026-09-26T10:00:00Z", items: [{ ...studioOperation().items[0], id: "edit-item", action: "edit", state: "queued", input: { sourceVersionId: "version-one", instruction: "Make the sky orange" } }] }));
  localStorage.setItem(`thumbnail-studio:operations:clerk:alice:${projectId}`, JSON.stringify([id]));
  open();
  const change = await screen.findByText("Make the sky orange");
  expect(change.closest("section[aria-label='Studio operation']")).not.toBeNull();
});
it("audits in one click at 2 credits, or 3 with persona opinions", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "3. Refine" }));
  fireEvent.click(screen.getByRole("tab", { name: "Audit" }));
  expect(screen.getByRole("button", { name: "Audit this version · 2 credits" })).toBeEnabled();
  fireEvent.click(screen.getByLabelText(/Include AI persona opinions/));
  fireEvent.click(screen.getByRole("button", { name: "Audit this version · 3 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledWith({ items: [expect.objectContaining({ action: "audit", input: { sourceVersionId: "version-one", includePersonas: true } })] });
});
it("suggests titles in one free click", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "1. Brief" }));
  fireEvent.click(screen.getByRole("button", { name: "Suggest two video titles · free" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledWith({ items: [expect.objectContaining({ action: "suggest_titles" })] });
});
it("downloads the refined version free from its toolbar, in the chosen format, without gallery side effects", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "3. Refine" }));
  const refine = screen.getByRole("region", { name: "Refine this version" });
  fireEvent.click(within(refine).getByRole("button", { name: "File format" }));
  fireEvent.click(screen.getByRole("option", { name: "JPEG" }));
  fireEvent.click(within(refine).getByRole("button", { name: "Download" }));
  await waitFor(() => expect(api.exportVersion).toHaveBeenCalledWith("version-one", "jpeg", "original"));
  expect(require("../../../../hooks/useThumbnailGallery").downloadGalleryThumbnail).not.toHaveBeenCalled();
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("lands a generation started on /generate on step 2 and starts it once at the price that button showed", async () => {
  project.versions = [];
  api.project.mockResolvedValue(project);
  open({ state: { studioEntry: { startGeneration: true, conceptCount: 2, quality: "high", generationCredits: 30 } } });
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.quote.mock.calls[0][0].items).toHaveLength(2);
  expect(await screen.findByRole("region", { name: "Your brief" })).toHaveTextContent("A real video");
  expect(screen.getByRole("button", { name: "2. Choose" })).toHaveAttribute("aria-current", "step");
  expect(await screen.findByText(/Your concepts are being created/)).toBeInTheDocument();
  expect(within(work()).getByRole("heading", { name: "In progress" })).toBeInTheDocument();
  expect(screen.getByLabelText(/Video title or idea/)).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Edit brief" }));
  expect(screen.getByLabelText(/Video title or idea/)).toBeVisible();
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.start).toHaveBeenCalledTimes(1);
});
it("does not start from /generate when the balance does not cover it, and says why", async () => {
  require("../../../../api/ctr").ctrApi.getQuota.mockResolvedValue(credits(5));
  project.versions = [];
  api.project.mockResolvedValue(project);
  // The balance is known before the project page opens (the create page read it).
  await client.fetchQuery({ queryKey: ["thumbnail-studio", "usage", "clerk:alice"], queryFn: () => credits(5) });
  open({ state: { studioEntry: { startGeneration: true, conceptCount: 2, quality: "high", generationCredits: 30 } } });
  const brief = await screen.findByRole("region", { name: "Your brief" });
  expect(within(brief).getByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled();
  await waitFor(() => expect(creditsNotice()).toHaveTextContent("Not enough credits — you have 5"));
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});
it("retries a failed concept in one click, as a retry of that output", async () => {
  const at = (offset: number) => new Date(Date.now() + offset).toISOString();
  const failedId = "cccccccc-0000-4000-8000-000000000001";
  // Concept 2 of 3 failed; the others are ready.
  const failed = studioOperation({ id: failedId, state: "partial", startedAt: at(-600_000), finishedAt: at(-300_000), capturedCredits: 30, releasedCredits: 15 });
  failed.items = [0, 1, 2].map(index => ({
    ...failed.items[0],
    id: `concept-${index}`,
    input: { conceptIndex: index, conceptCount: 3, quality: "high" as const },
    state: index === 1 ? "failed" as const : "succeeded" as const,
    retryable: index === 1,
    retryMode: index === 1 ? "identical_item" as const : null,
    errorCode: index === 1 ? "PROVIDER_ERROR" : null,
    preparedConcept: { name: `Concept ${index + 1}` },
  }));
  operations.set(failedId, failed);
  const storageKey = `thumbnail-studio:operations:clerk:alice:${projectId}`;
  localStorage.setItem(storageKey, JSON.stringify([failedId]));
  open();
  fireEvent.click(await within(await screen.findByLabelText("Ongoing work and results")).findByRole("button", { name: "Retry · 15 credits" }));
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(api.quote.mock.calls[0][0]).toEqual({
    items: [{ projectId, revisionId: "revision-one", action: "generate", input: { conceptIndex: 1, conceptCount: 3, quality: "high" } }],
    retryOfItemId: "concept-1",
  });
  // The failed work keeps its entry while the retry runs.
  expect(await within(work()).findByRole("heading", { name: "In progress" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toContain(failedId);
  // The creator can still put the failed work away.
  fireEvent.click(within(work()).getByRole("button", { name: "Dismiss" }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey)!)).not.toContain(failedId));
});
it("never shows an old stored quote and removes it from storage", async () => {
  const quote = quoteOf({ items: [{ projectId, revisionId: "revision-one", action: "generate", input: { conceptIndex: 0, conceptCount: 1, quality: "high" } }] });
  const storageKey = `thumbnail-studio:operations:clerk:alice:${projectId}`;
  localStorage.setItem(storageKey, JSON.stringify([quote.id]));
  open();
  await screen.findByRole("button", { name: "2. Choose" });
  await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
  expect(screen.queryByRole("region", { name: "Studio operation" })).not.toBeInTheDocument();
  expect(api.start).not.toHaveBeenCalled();
});

it("does not report a successful download when the export fails", async () => {
  api.exportVersion.mockRejectedValueOnce(new Error("Export unavailable"));
  open();
  fireEvent.click(await screen.findByRole("button", { name: "3. Refine" }));
  const refine = within(screen.getByRole("region", { name: "Refine this version" }));
  fireEvent.click(refine.getByRole("button", { name: "Download" }));
  expect(await refine.findByRole("alert")).toHaveTextContent("Could not download this image");
  expect(downloadStudioBlob).not.toHaveBeenCalled();
});
it("retains free selection and export when the signed preview is unavailable", async () => {
  project.versions[0].asset = null;
  api.asset.mockRejectedValueOnce(new Error("Preview unavailable"));
  open();
  const download = await screen.findByRole("button", { name: "Download" });
  expect(download).toBeEnabled();
  fireEvent.click(download);
  await waitFor(() => expect(api.exportVersion).toHaveBeenCalledWith("version-one", "png", "original"));
  fireEvent.click(screen.getByRole("button", { name: "Keep this version" }));
  await waitFor(() => expect(api.patchProject).toHaveBeenCalledWith(projectId, 1, expect.objectContaining({ selectedVersionId: "version-one" })));
});
it("focuses a suggestion when it opens and returns focus to its button when it closes", async () => {
  const id = "dddddddd-0000-4000-8000-000000000077";
  const ready = studioOperation({ id, state: "succeeded", startedAt: "2026-09-26T10:00:00Z", finishedAt: "2026-09-26T10:01:00Z" });
  ready.items = [{ ...ready.items[0], action: "suggest_titles", state: "succeeded", artifact: { kind: "title_suggestions", titles: [{ title: "A sharper title", explanation: "Shorter" }] } }];
  operations.set(id, ready);
  localStorage.setItem(`thumbnail-studio:operations:clerk:alice:${projectId}`, JSON.stringify([id]));
  open();
  const review = await screen.findByRole("button", { name: "Review suggestion" });
  review.focus();
  fireEvent.click(review);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Review this suggestion" })).toHaveFocus());
  fireEvent.click(screen.getByRole("button", { name: "Close without applying" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Review suggestion" })).toHaveFocus());
});
it("shows the server's export advice instead of a generic download error", async () => {
  const { StudioRequestError } = require("../../../../api/studioErrors");
  api.exportVersion.mockRejectedValue(new StudioRequestError("EXPORT_TOO_LARGE", "This PNG exceeds 2 MiB. Export the original PNG or choose JPEG."));
  open();
  fireEvent.click(await screen.findByRole("button", { name: "3. Refine" }));
  const refine = within(screen.getByRole("region", { name: "Refine this version" }));
  fireEvent.click(refine.getByRole("button", { name: "Download" }));
  expect(await refine.findByRole("alert")).toHaveTextContent("This PNG exceeds 2 MiB. Export the original PNG or choose JPEG.");
});
