import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GalleryPage from "../GalleryPage";

jest.mock("@clerk/clerk-react", () => ({ useUser: () => ({ isSignedIn: true, isLoaded: true }) }));
jest.mock("../../../../contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock("../../../../hooks/useCTREngine", () => ({ __esModule: true, default: () => ({ usageAccess: null, isLoadingQuota: false }) }));
jest.mock("../AIThumbnailsLayout", () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("../components/ThumbnailDetailDrawer", () => ({ ThumbnailDetailDrawer: () => null }));
jest.mock("../components/ViralSharePopup", () => ({ ViralSharePopup: () => null }));
const base = { thumbnailUrl: "https://example.invalid/a.png", size: "1536x864", quality: "high", style: "", downloadCount: 0, createdAt: "2026-10-30T10:00:00.000Z", shareUrl: null };
jest.mock("../../../../hooks/useThumbnailGallery", () => ({
  useThumbnailGallery: () => ({
    gallery: [
      { ...base, id: 1, prompt: "Apply the requested image changes. Preserve identity, composition…", title: "From Bronze to Unreal in 30 days", studio: true },
      { ...base, id: 2, prompt: "A neon city at night", title: null },
    ],
    galleryLoading: false,
    loadGallery: jest.fn(),
    deleteFromGallery: jest.fn(),
    downloadThumbnail: jest.fn(),
    error: null,
  }),
}));

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

it("titles a Studio image with its video's name, never the prompt sent to the image model", () => {
  render(<MemoryRouter><GalleryPage /></MemoryRouter>);
  expect(screen.getByText("From Bronze to Unreal in 30 days")).toBeInTheDocument();
  expect(screen.queryByText(/Apply the requested image changes/)).not.toBeInTheDocument();
  // An older image without a project keeps its own prompt.
  expect(screen.getByText("A neon city at night")).toBeInTheDocument();
});
