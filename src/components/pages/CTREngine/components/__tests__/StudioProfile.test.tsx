import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChannelProfilePanel } from "../studio/ChannelProfilePanel";
import { thumbnailStudioApi } from "../../../../../api/thumbnailStudio";
import { defaultStudioSettings } from "../../../../../types/thumbnailStudio";
jest.mock("../../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../../../common/ThumbnailPackaging", () => ({
  ThumbnailStylePicker: () => null,
}));
jest.mock("../../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    profiles: jest.fn(),
    patchProfile: jest.fn(),
    createProfile: jest.fn(),
    asset: jest.fn(),
  },
  studioError: (e: any) => e.response?.data?.error || { message: e.message },
}));
// The plan (channel profile limit, videos left): not read in these tests.
jest.mock("../../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../../api/subscriptions"),
  subscriptionsApi: { getMe: jest.fn(() => new Promise(() => undefined)), getPlans: jest.fn(() => new Promise(() => undefined)) },
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
const profile = {
  id: "profile-id",
  version: 1,
  name: "My channel",
  youtubeChannelId: null,
  settings: defaultStudioSettings(),
  isDefault: false,
  archived: false,
  createdAt: "2026-09-26T10:00:00Z",
  updatedAt: "2026-09-26T10:00:00Z",
};
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  api.profiles.mockResolvedValue({ items: [profile], nextCursor: null });
});
afterEach(() => client.clear());
it("keeps conflicting changes and allows an explicit new profile copy", async () => {
  api.patchProfile.mockRejectedValue({
    response: {
      data: {
        error: {
          code: "PROFILE_CHANGED",
          message: "The profile changed elsewhere",
        },
      },
    },
  });
  api.createProfile.mockResolvedValue({ ...profile, id: "copy" });
  render(
    <QueryClientProvider client={client}>
      <ChannelProfilePanel />
    </QueryClientProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit My channel" }));
  fireEvent.change(screen.getByLabelText("Profile name"), {
    target: { value: "My local preferences" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByRole("button", {
    name: "Keep my changes as a new profile",
  });
  expect(screen.getByLabelText("Profile name")).toHaveValue(
    "My local preferences",
  );
  expect(api.patchProfile).toHaveBeenCalledWith(
    "profile-id",
    1,
    expect.objectContaining({ name: "My local preferences" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Keep my changes as a new profile" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() =>
    expect(api.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My local preferences (copy)",
        settings: profile.settings,
      }),
    ),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "New profile" }),
    ).not.toBeDisabled(),
  );
});
it("applies a profile only after the creator chooses it", async () => {
  const apply = jest.fn().mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={client}>
      <ChannelProfilePanel onApply={apply} />
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "Apply My channel" });
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply My channel" }));
  await waitFor(() =>
    expect(apply).toHaveBeenCalledWith({ id: "profile-id", version: 1 }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "New profile" }),
    ).not.toBeDisabled(),
  );
});
it("in Settings, lists profiles as cards and opens the profile a link asks for", async () => {
  render(
    <QueryClientProvider client={client}>
      <ChannelProfilePanel editProfileId="profile-id" />
    </QueryClientProvider>,
  );
  expect(await screen.findByLabelText("Profile name")).toHaveValue("My channel");
  expect(screen.getByRole("form", { name: "Edit My channel" })).toBeInTheDocument();
  expect(screen.getByText("English · Heavy block letters · Suggested text")).toBeInTheDocument();
  // The project wording stays on the project page.
  expect(screen.queryByText(/Applying a profile copies/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Apply/ })).not.toBeInTheDocument();
});

it('loads a legacy font profile and saves the chosen lettering with its local overlay font', async () => {
  const legacy = { ...profile, settings: { ...profile.settings, style: { ...profile.settings.style, font: 'DejaVu Serif' as const } } };
  delete legacy.settings.style.lettering;
  api.profiles.mockResolvedValue({ items: [legacy], nextCursor: null });
  api.patchProfile.mockResolvedValue(profile);
  render(<QueryClientProvider client={client}><ChannelProfilePanel /></QueryClientProvider>);
  await screen.findByText('English · Elegant serif · Suggested text');
  fireEvent.click(screen.getByRole('button', { name: 'Edit My channel' }));
  expect(screen.getByRole('button', { name: 'Lettering style' })).toHaveTextContent('Elegant serif');
  fireEvent.click(screen.getByRole('button', { name: 'Lettering style' }));
  expect(await screen.findAllByRole('option')).toHaveLength(8);
  expect(screen.queryByText('DejaVu Serif')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: 'Comic', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(api.patchProfile).toHaveBeenCalledWith('profile-id', 1, expect.objectContaining({ settings: expect.objectContaining({ style: expect.objectContaining({ lettering: 'comic', font: 'DejaVu Sans' }) }) })));
});

it('creates a new channel profile with heavy block lettering by default', async () => {
  api.createProfile.mockResolvedValue(profile);
  render(<QueryClientProvider client={client}><ChannelProfilePanel /></QueryClientProvider>);
  await screen.findByText('English · Heavy block letters · Suggested text');
  fireEvent.click(screen.getByRole('button', { name: 'New profile' }));
  fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'New channel' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(api.createProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'New channel', settings: expect.objectContaining({ style: expect.objectContaining({ lettering: 'heavy_block', font: 'DejaVu Sans' }) }) })));
});
