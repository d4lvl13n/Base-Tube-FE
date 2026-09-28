import React, { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import GeneratePage from "../GeneratePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCTREngine from "../../../../hooks/useCTREngine";
import { thumbnailStudioApi } from "../../../../api/thumbnailStudio";
import {
  saveStudioDraft,
  loadStudioDraft,
  StudioDraft,
} from "../../../../utils/studioDraft";
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
    // Generate lands on step 2 and starts there at the price shown; a source opens its panel on the brief.
    expect(destination.path).toBe(`/ai-thumbnails/projects/${studioProject().id}${source === "idea" ? "" : `?source=${source}`}`);
    expect(destination.state.studioEntry.startGeneration).toBe(source === "idea");
    expect(destination.state.studioEntry.generationCredits).toBe(source === "idea" ? 30 : undefined);
    expect(api.createProject).toHaveBeenCalledTimes(1);
    expect(api.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        briefInput: expect.objectContaining({ videoTitle: "New video" }),
      }),
    );
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
  expect(destination.state.studioEntry.startGeneration).toBe(false);
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
  expect(destination.state.studioEntry).toMatchObject({ startGeneration: true, conceptCount: 3, quality: "high", generationCredits: 45 });
  expect(api.createProject).toHaveBeenCalledTimes(1);
  expect(api.createProject).toHaveBeenCalledWith(expect.objectContaining({
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
  expect(api.createProject).toHaveBeenCalledWith(expect.objectContaining({ briefInput: expect.objectContaining({ videoTitle: "Survives a reload" }) }));
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
