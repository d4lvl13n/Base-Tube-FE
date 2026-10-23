import React, { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import GeneratePage from "../GeneratePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCTREngine from "../../../../hooks/useCTREngine";
import { thumbnailStudioApi } from "../../../../api/thumbnailStudio";
import {
  saveStudioDraft,
  saveStudioCreateDraft,
  loadStudioDraft,
  StudioDraft,
} from "../../../../utils/studioDraft";
import { emptyStudioBrief } from "../../../../types/thumbnailStudio";
import { studioProject } from "../../../../tests/fixtures/studio";

jest.mock("../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: () => "clerk:entry-owner",
}));
jest.mock("../../../../hooks/useCTREngine", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../AIThumbnailsLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <main>{children}</main>,
}));
jest.mock("../../../common/ThumbnailPackaging", () => ({
  ThumbnailStylePicker: () => null,
}));
jest.mock("../../../common/ThumbnailLogoPicker", () => ({
  ThumbnailLogoPicker: () => null,
}));
jest.mock("../../../common/ThumbnailSubjectPicker", () => ({
  ThumbnailSubjectPicker: () => null,
}));
jest.mock("../components/NicheSelector", () => ({ NicheSelector: () => null }));
jest.mock("../components/ThumbnailFormatSelector", () => ({
  ThumbnailFormatSelector: () => null,
}));
jest.mock("../components/BuyCreditsModal", () => ({
  BuyCreditsModal: () => null,
}));
jest.mock("../components/ThumbnailDetailDrawer", () => ({
  ThumbnailDetailDrawer: () => null,
}));
jest.mock("../components/GeneratedConceptsGrid", () => ({
  GeneratedConceptsGrid: () => <p>Existing legacy result</p>,
}));
jest.mock("../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    profiles: jest.fn(),
    createProject: jest.fn(),
    createGeneration: jest.fn(),
    assetFromThumbnail: jest.fn(),
    importLegacyProfile: jest.fn(),
    quote: jest.fn(),
    start: jest.fn(),
    capabilities: jest.fn(),
  },
  studioError: (error: Error) => ({ code: "ERROR", message: error.message }),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let access: any;
let draftSequence = 0;
const draft: StudioDraft = {
  videoTitle: "A saved idea",
  description: "What happens",
  creatorHook: "The discovery",
  direction: "Two objects",
  headline: "MY EXACT WORDS",
  format: "short",
  count: 3,
  quality: "low",
  includeFace: true,
  niche: "tech",
  savedStyleId: 42,
  savedStyleHasLogo: true,
  localFiles: [{ name: "product.png", purpose: "subject" }],
};
function Destination() {
  const location = useLocation();
  return (
    <pre data-testid="destination">
      {JSON.stringify({
        path: location.pathname + location.search,
        state: location.state,
      })}
    </pre>
  );
}
function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname + location.search}</div>;
}
function open(path = "/ai-thumbnails/generate", state?: object) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><StrictMode>
      <MemoryRouter
        initialEntries={[
          {
            pathname: path.split("?")[0],
            search: path.includes("?") ? `?${path.split("?")[1]}` : "",
            state,
          },
        ]}
      >
        <CurrentLocation />
        <Routes>
          <Route path="/ai-thumbnails/generate" element={<GeneratePage />} />
          <Route
            path="/ai-thumbnails/projects/:projectId"
            element={<Destination />}
          />
        </Routes>
      </MemoryRouter>
    </StrictMode></QueryClientProvider>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  Object.defineProperty(global, "crypto", { configurable: true, value: { randomUUID: () => "44444444-4444-4444-8444-444444444444" } });
  api.createGeneration.mockResolvedValue({ projectId: studioProject().id, operationId: "op" });
  window.matchMedia = jest.fn(() => ({ matches: true })) as any;
  access = {
    isAuthenticated: true,
    isAnonymous: false,
    generatedConcepts: [],
    generationProgress: { status: "idle" },
    isLoadingQuota: false,
    niches: [],
  };
  (useCTREngine as jest.Mock).mockImplementation(() => access);
  api.profiles.mockResolvedValue({ items: [], nextCursor: null });
  api.createProject.mockResolvedValue(studioProject());
  api.assetFromThumbnail.mockResolvedValue({ id: "owned-style-asset" } as any);
  api.capabilities.mockResolvedValue({
    operations: { available: true, reason: null },
    pricing: { thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 }, ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept: 15 } },
  } as any);
});

it.each([
  ["Generate 2 concepts · 30 credits", "idea"],
  ["Add a YouTube link", "youtube"],
  ["Use an existing image", "image"],
  ["Add a script", "script"],
])(
  "opens %s as a saved project and preserves the chosen source",
  async (label, source) => {
    open();
    expect(screen.getByRole("heading", { name: "What’s your video about?" })).toBeInTheDocument();
    expect(screen.queryByText("Where would you like to start?")).not.toBeInTheDocument();
    expect(api.createProject).not.toHaveBeenCalled();
    if (source !== "idea") fireEvent.click(screen.getByText("Add a video, script or existing image"));
    fireEvent.change(screen.getByLabelText(/Video title or idea/), {
      target: { value: "New video" },
    });
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(label) }));
    const destination = JSON.parse((await screen.findByTestId("destination")).textContent!);
    expect(destination.path).toBe(`/ai-thumbnails/projects/${studioProject().id}${source === "idea" ? "" : `?source=${source}`}`);
    if (source === "idea") {
      expect(destination.state).toBeNull();
      expect(api.createProject).not.toHaveBeenCalled();
      expect(api.createGeneration).toHaveBeenCalledWith(expect.objectContaining({ briefInput: expect.objectContaining({ videoTitle: "New video" }), generation: { conceptCount: 2, quality: "high", expectedCredits: 30 } }), expect.any(String));
    } else {
      expect(destination.state.studioEntry.startGeneration).toBeUndefined();
      expect(api.createProject).toHaveBeenCalledTimes(1);
      expect(api.createGeneration).not.toHaveBeenCalled();
    }
    expect(api.quote).not.toHaveBeenCalled();
    expect(api.start).not.toHaveBeenCalled();
  },
);

it.each(["Add a YouTube link", "Add a script", "Use an existing image"])("can %s before a title is known without requesting generation", async label => {
  open();
  expect(await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled();
  fireEvent.click(screen.getByText("Add a video, script or existing image"));
  fireEvent.click(screen.getByRole("button", { name: label }));
  const destination = JSON.parse((await screen.findByTestId("destination")).textContent!);
  expect(destination.state.studioEntry.startGeneration).toBeUndefined();
  expect(api.createProject).toHaveBeenCalledWith(expect.objectContaining({ name: "Untitled video" }));
  expect(api.quote).not.toHaveBeenCalled(); expect(api.start).not.toHaveBeenCalled();
});

it("fills the form with the brief a visitor wrote before signing up, and saves or starts nothing until Generate", async () => {
  const id = `visitor-${++draftSequence}`;
  saveStudioDraft(id, { ...draft, quality: "high", count: 3, textMode: "exact", layout: "before_after", niche: null, includeFace: false, savedStyleId: undefined, savedStyleHasLogo: false, localFiles: [] });
  const first = open("/ai-thumbnails/generate");
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue(draft.videoTitle);
  expect(screen.getByLabelText("Creator hook")).toHaveValue(draft.creatorHook);
  // The visitor's concept count; the price follows it (3 × 15).
  expect(await screen.findByRole("button", { name: "Generate 3 concepts · 45 credits" })).toBeEnabled();
  await waitFor(() => expect(loadStudioDraft(id)).toBeNull());
  expect(api.createProject).not.toHaveBeenCalled();
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
  // It is now this account's create draft: a reload keeps it.
  first.unmount();
  open();
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue(draft.videoTitle);
  // One click saves it as a project and starts that generation there.
  fireEvent.click(await screen.findByRole("button", { name: "Generate 3 concepts · 45 credits" }));
  const destination = JSON.parse((await screen.findByTestId("destination")).textContent!);
  expect(destination.state).toBeNull();
  expect(api.createGeneration).toHaveBeenCalledTimes(1);
  expect(api.createGeneration.mock.calls[0][0]).toEqual(expect.objectContaining({
    briefInput: expect.objectContaining({
      videoTitle: draft.videoTitle,
      summary: draft.description,
      creatorHook: draft.creatorHook,
      visualDirection: draft.direction,
      outputFormat: "portrait",
      layout: "before_after",
      overrides: expect.objectContaining({ text: { mode: "exact", value: draft.headline } }),
    }),
  }));
});

it("does not consume the auth draft before the account is loaded", () => {
  const id = `auth-${++draftSequence}`;
  saveStudioDraft(id, draft);
  access.isAuthenticated = false;
  access.isAnonymous = false;
  open(`/ai-thumbnails/generate?draft=${id}`);
  expect(screen.getByRole("status")).toHaveTextContent("Loading your account");
  expect(loadStudioDraft(id)).not.toBeNull();
  expect(api.createProject).not.toHaveBeenCalled();
});

it("keeps an unsaved brief across a reload and clears it once its project exists", async () => {
  const first = open();
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "Survives a reload" } });
  first.unmount();
  open();
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue("Survives a reload");
  fireEvent.click(await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await screen.findByTestId("destination");
  expect(api.createGeneration.mock.calls[0][0]).toEqual(expect.objectContaining({ briefInput: expect.objectContaining({ videoTitle: "Survives a reload" }) }));
  expect(sessionStorage.getItem("thumbnail-studio:create:v1:clerk:entry-owner")).toBeNull();
});
it("disables Generate with the price and Buy credits when the balance does not cover it", async () => {
  access.usageAccess = { mode: "credits", creditInfo: { balance: 5, reserved: 0, available: 5 }, pricing: null };
  open();
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "New video" } });
  expect(await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" })).toBeDisabled();
  expect(await screen.findByRole("alert")).toHaveTextContent("Not enough credits — you have 5");
  expect(screen.getByRole("button", { name: "Buy credits" })).toBeInTheDocument();
  fireEvent.submit(screen.getByRole("form", { name: "Thumbnail brief" }));
  expect(api.createProject).not.toHaveBeenCalled();
});

it("replays a lost response after reload with the same request key", async () => {
  api.createGeneration.mockRejectedValueOnce(new Error("Network interrupted"));
  const first = open();
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "Durable request" } });
  fireEvent.click(await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await screen.findByRole("alert");
  const [body, key] = api.createGeneration.mock.calls[0];
  first.unmount();
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" }));
  await screen.findByTestId("destination");
  expect(api.createGeneration.mock.calls[1]).toEqual([body, key]);
  expect(api.createProject).not.toHaveBeenCalled();
});
it("sends one atomic request even if Create unmounts before the response", async () => {
  let resolve!: (value: any) => void;
  api.createGeneration.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const view = open();
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "Leave immediately" } });
  const button = await screen.findByRole("button", { name: "Generate 2 concepts · 30 credits" });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(api.createGeneration).toHaveBeenCalledTimes(1));
  view.unmount();
  resolve({ projectId: studioProject().id, operationId: "op" });
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});

 it("consumes a link idea ahead of both saved drafts and preserves edits after reload", async () => {
  saveStudioDraft("old-visitor", draft);
  saveStudioCreateDraft("clerk:entry-owner", { brief: { ...emptyStudioBrief(), videoTitle: "Old account idea", creatorHook: "Old hook" }, count: 3, quality: "standard" });
  const view = open("/ai-thumbnails/generate?prompt=Floor%20is%20lava&site_ref=hero&video=abcdefghijk");
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue("Floor is lava");
  expect(screen.getByLabelText("Creator hook")).toHaveValue("");
  expect(screen.getByTestId("current-location")).toHaveTextContent(/^\/ai-thumbnails\/generate\?video=abcdefghijk$/);
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "My edited lava idea" } });
  const cleanedUrl = screen.getByTestId("current-location").textContent!;
  view.unmount();
  open(cleanedUrl);
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue("My edited lava idea");
  expect(api.createGeneration).not.toHaveBeenCalled();
 });
 it("an explicit visitor draft wins over the prompt and remains editable after refresh", () => {
  saveStudioDraft("chosen", draft);
  const view = open("/ai-thumbnails/generate?draft=chosen&prompt=Different&site_ref=footer");
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue(draft.videoTitle);
  fireEvent.change(screen.getByLabelText(/Video title or idea/), { target: { value: "Edited explicit draft" } });
  const cleanedUrl = screen.getByTestId("current-location").textContent!;
  expect(cleanedUrl).toBe("/ai-thumbnails/generate?draft=chosen");
  view.unmount();
  open(cleanedUrl);
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue("Edited explicit draft");
 });
 it.each(["<script>alert(1)</script>", "a".repeat(600)])("treats a prompt as bounded plain text", prompt => {
  const view = open(`/ai-thumbnails/generate?prompt=${encodeURIComponent(prompt)}`);
  expect(screen.getByLabelText(/Video title or idea/)).toHaveValue(prompt.slice(0, 500));
  expect(view.container.querySelector("script")).toBeNull();
  expect(api.createGeneration).not.toHaveBeenCalled();
 });
