import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GeneratePage from "../GeneratePage";
import { useAuth } from "../../../../contexts/AuthContext";
import { loadStudioDraft, saveStudioDraft } from "../../../../utils/studioDraft";
jest.mock("@clerk/clerk-react", () => ({ useUser: () => ({ isSignedIn: false, isLoaded: true, user: null }) }));
jest.mock("../../../../contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../../../../api/ctr", () => ({
  ctrApi: {
    getNiches: jest.fn().mockResolvedValue([]),
    getQuota: jest.fn().mockResolvedValue({ mode: "credits", creditInfo: { balance: 10, reserved: 0, available: 10 }, pricing: null }),
    getFaceReference: jest.fn().mockResolvedValue(null),
  },
  fileToBase64: jest.fn(),
}));
jest.mock("../VisitorCreatePage", () => ({ __esModule: true, default: () => <p>Visitor create screen</p> }));
jest.mock("../AIThumbnailsLayout", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock("../StudioCreatePage", () => ({ __esModule: true, default: () => <p>Studio create screen</p> }));
jest.mock("../components/ThumbnailFormatSelector", () => ({ ThumbnailFormatSelector: () => null }));
jest.mock("../components/BuyCreditsModal", () => ({ BuyCreditsModal: () => null }));
jest.mock("../components/ThumbnailDetailDrawer", () => ({ ThumbnailDetailDrawer: () => null }));
const draft = {
  videoTitle: "Wallet creator video", creatorHook: "", description: "", direction: "", headline: "",
  format: "landscape" as const, quality: "high" as const, count: 2,
  niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [],
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: true })) as any;
  jest.clearAllMocks();
});
it("waits for a wallet session being restored and keeps the saved ?draft= for the Studio", () => {
  localStorage.setItem("auth_method", "web3");
  saveStudioDraft("wallet-draft", draft);
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null, isRestoring: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = () => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/ai-thumbnails/generate?draft=wallet-draft"]}>
        <GeneratePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const view = render(page());
  expect(screen.getByRole("status")).toHaveTextContent("Loading your account");
  expect(screen.queryByText("Visitor create screen")).not.toBeInTheDocument();
  expect(loadStudioDraft("wallet-draft")?.draft.videoTitle).toBe("Wallet creator video");
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 7 }, isRestoring: false });
  view.rerender(page());
  expect(screen.getByText("Studio create screen")).toBeInTheDocument();
  expect(loadStudioDraft("wallet-draft")).not.toBeNull();
  client.clear();
});
