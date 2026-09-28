import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StudioProjectsPage from "../StudioProjectsPage";
import StudioBatchReview from "../StudioBatchReview";
import { thumbnailStudioApi } from "../../../../api/thumbnailStudio";
import { studioOperation, studioProject } from "../../../../tests/fixtures/studio";
import type { StudioOperation, StudioProject } from "../../../../types/thumbnailStudio";
jest.mock("../../../../api/ctr", () => ({ ctrApi: { getQuota: jest.fn() } }));
jest.mock("../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));
jest.mock("../../../../hooks/useCTREngine", () => ({
  __esModule: true,
  default: () => ({ isAuthenticated: true, isAnonymous: false, isLoadingQuota: false, usageAccess: null }),
}));
const catalog = {
  thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 },
  ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept: 15 },
};
jest.mock("../../../../hooks/useStudioCapabilities", () => ({
  useStudioStartAvailability: () => ({ available: true, message: null }),
  useStudioPricing: () => catalog,
  useStudioCapabilities: () => ({ data: undefined }),
  studioStartUnavailableMessage: () => "Starting new work is temporarily unavailable.",
}));
jest.mock("../AIThumbnailsLayout", () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock("../components/BuyCreditsModal", () => ({ BuyCreditsModal: () => null }));
jest.mock("../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    projects: jest.fn(),
    project: jest.fn(),
    patchProject: jest.fn(),
    asset: jest.fn(),
    quote: jest.fn(),
    start: jest.fn(),
    operation: jest.fn(),
  },
  studioError: (e: any) => ({ code: "ERROR", message: e.message }),
  downloadStudioBlob: jest.fn(),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  require("../../../../api/ctr").ctrApi.getQuota.mockResolvedValue({ mode: "credits", creditInfo: { balance: 100, reserved: 0, available: 100 }, pricing: null });
  Object.defineProperty(global, "crypto", { configurable: true, value: { randomUUID: () => "44444444-4444-4444-8444-444444444444" } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => client.clear());
const page = (path: string, element: React.ReactNode) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/ai-thumbnails/projects" element={element} />
          <Route path="/ai-thumbnails/projects/batch" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("projects list", () => {
  it("hides a project from the list as a secondary action and shows hidden projects on request", async () => {
    const visible = studioProject({ id: "11111111-1111-4111-8111-000000000001", name: "Visible video" });
    const hidden = studioProject({ id: "11111111-1111-4111-8111-000000000002", name: "Hidden video", archived: true });
    api.projects.mockImplementation(async (params) => ({ items: params?.archived ? [visible, hidden] : [visible], nextCursor: null }));
    api.project.mockImplementation(async (id) => (id === visible.id ? { ...visible, lockVersion: 4 } : { ...hidden, lockVersion: 7 }));
    api.patchProject.mockImplementation(async (id, _lock, patch) => ({ ...(id === visible.id ? visible : hidden), ...patch }) as StudioProject);
    page("/ai-thumbnails/projects", <StudioProjectsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Hide from list: Visible video" }));
    expect(screen.queryByRole("button", { name: /archive/i })).not.toBeInTheDocument();
    await waitFor(() => expect(api.patchProject).toHaveBeenCalledWith(visible.id, 4, { archived: true }));
    fireEvent.click(screen.getByLabelText("Show hidden projects"));
    const hiddenLink = await screen.findByRole("link", { name: /Hidden video/ });
    expect(hiddenLink).toHaveTextContent(/Hidden · Updated/);
    // A hidden project opens normally.
    expect(hiddenLink).toHaveAttribute("href", `/ai-thumbnails/projects/${hidden.id}`);
    fireEvent.click(screen.getByRole("button", { name: "Show in list: Hidden video" }));
    await waitFor(() => expect(api.patchProject).toHaveBeenCalledWith(hidden.id, 7, { archived: false }));
  });
});

describe("batch", () => {
  const ids = ["22222222-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000002"];
  let projects: StudioProject[];
  let operations: Map<string, StudioOperation>;
  beforeEach(() => {
    operations = new Map();
    projects = ids.map((id, index) => studioProject({ id, name: `Video ${index + 1}`, currentRevisionId: `revision-${index}` }));
    projects[1].archived = true; // hidden projects can be part of a batch: the start restores them
    api.projects.mockResolvedValue({ items: projects, nextCursor: null });
    api.project.mockImplementation(async (id) => projects.find((project) => project.id === id)!);
    api.quote.mockImplementation(async (input) => {
      const op = studioOperation({
        id: "55555555-0000-4000-8000-000000000001",
        quotedCredits: input.items.length * 15,
        items: input.items.map((item, index) => ({ ...studioOperation().items[0], ...item, id: `item-${index}`, quotedCredits: 15 })),
      });
      operations.set(op.id, op);
      return op;
    });
    api.start.mockImplementation(async (id) => {
      const started = { ...operations.get(id)!, state: "running" as const, startedAt: new Date().toISOString() };
      operations.set(id, started);
      return started;
    });
    api.operation.mockImplementation(async (id) => operations.get(id)!);
  });
  it("generates every video in one click at the total price, with each video's price shown", async () => {
    page(`/ai-thumbnails/projects/batch?projects=${ids.join(",")}`, <StudioBatchReview />);
    expect(await screen.findByRole("button", { name: "Generate all · 60 credits" })).toBeEnabled();
    // Each video shows its own price.
    expect(screen.getAllByText("2 concepts · 30 credits")).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText("Concepts")[0]);
    fireEvent.click(screen.getByRole("option", { name: "1" }));
    expect(screen.getByText("1 concept · 15 credits")).toBeInTheDocument();
    expect(screen.getAllByText("2 concepts · 30 credits")).toHaveLength(1);
    fireEvent.click(await screen.findByRole("button", { name: "Generate all · 45 credits" }));
    await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
    expect(api.quote).toHaveBeenCalledTimes(1);
    expect(api.quote.mock.calls[0][0].items.map((item) => item.projectId)).toEqual([ids[0], ids[1], ids[1]]);
    expect(api.start.mock.calls[0][1]).toBe(JSON.parse(localStorage.getItem("thumbnail-studio:start:v1:55555555-0000-4000-8000-000000000001")!).key);
    expect(await screen.findByRole("heading", { name: "In progress" })).toBeInTheDocument();
    expect(screen.queryByText(/get total price|confirm and start/i)).not.toBeInTheDocument();
  });
});
