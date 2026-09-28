import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudioProject, studioProjectKey } from "../useStudioProject";
import { thumbnailStudioApi } from "../../api/thumbnailStudio";
import { studioProject, projectId } from "../../tests/fixtures/studio";
import type { StudioProject } from "../../types/thumbnailStudio";
jest.mock("../useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    project: jest.fn(),
    patchProject: jest.fn(),
    createProject: jest.fn(),
  },
  studioError: (e: any) =>
    e.response?.data?.error || { code: "NETWORK_ERROR", message: e.message },
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const updated = (
  current: StudioProject,
  briefInput: StudioProject["currentRevision"]["briefInput"],
): StudioProject => ({
  ...current,
  lockVersion: current.lockVersion + 1,
  currentRevision: { ...current.currentRevision, briefInput },
});
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  api.project.mockResolvedValue(studioProject());
  api.patchProject.mockImplementation(async (_id, lock, patch) =>
    updated(studioProject({ lockVersion: lock }), patch.briefInput!),
  );
});
afterEach(() => client.clear());
it("autosaves after 800 ms and clean flushes do not remain locked", async () => {
  const { result } = renderHook(() => useStudioProject(projectId), { wrapper });
  await waitFor(() => expect(result.current.draft).not.toBeNull());
  await act(async () => {
    await result.current.save();
    await result.current.save();
  });
  expect(api.patchProject).not.toHaveBeenCalled();
  act(() =>
    result.current.setDraft({
      ...result.current.draft!,
      videoTitle: "Changed title",
    }),
  );
  await waitFor(() => expect(api.patchProject).toHaveBeenCalledTimes(1), {
    timeout: 1600,
  });
  expect(api.patchProject).toHaveBeenCalledWith(
    projectId,
    1,
    expect.objectContaining({
      briefInput: expect.objectContaining({ videoTitle: "Changed title" }),
    }),
  );
});
it("serializes edits made during a save using the returned lock version", async () => {
  const first = deferred<StudioProject>();
  api.patchProject.mockImplementationOnce(() => first.promise);
  const { result } = renderHook(() => useStudioProject(projectId), { wrapper });
  await waitFor(() => expect(result.current.draft).not.toBeNull());
  let saving!: Promise<StudioProject>;
  act(() => {
    result.current.setDraft({ ...result.current.draft!, videoTitle: "First" });
    saving = result.current.save();
  });
  await waitFor(() => expect(api.patchProject).toHaveBeenCalledTimes(1));
  act(() =>
    result.current.setDraft({ ...result.current.draft!, videoTitle: "Second" }),
  );
  await act(async () => {
    first.resolve(
      updated(studioProject(), {
        ...result.current.draft!,
        videoTitle: "First",
      }),
    );
    await saving;
  });
  expect(api.patchProject).toHaveBeenCalledTimes(2);
  expect(api.patchProject.mock.calls[1][1]).toBe(2);
  expect(api.patchProject.mock.calls[1][2].briefInput?.videoTitle).toBe(
    "Second",
  );
  expect(result.current.draft?.videoTitle).toBe("Second");
});
it("preserves a conflicting draft and copies inherited settings without advancing its profile", async () => {
  const original = studioProject();
  original.currentRevision.brief.rules = {
    faces: "forbid",
    logos: "forbid",
    prices: "forbid",
    additional: ["Keep it calm"],
  };
  original.currentRevision.briefInput.profile = {
    id: "profile-one",
    version: 2,
  };
  api.project.mockResolvedValue(original);
  api.patchProject.mockRejectedValue({
    response: {
      data: {
        error: { code: "PROJECT_CHANGED", message: "Changed elsewhere" },
      },
    },
  });
  api.createProject.mockResolvedValue(studioProject({ id: "copy" }));
  const { result } = renderHook(() => useStudioProject(projectId), { wrapper });
  await waitFor(() => expect(result.current.draft).not.toBeNull());
  await act(async () => {
    result.current.setDraft({
      ...result.current.draft!,
      videoTitle: "My local title",
      overrides: { rules: { prices: "allow" } },
    });
    await result.current.save().catch(() => undefined);
  });
  expect(result.current.saveError?.code).toBe("PROJECT_CHANGED");
  expect(result.current.draft?.videoTitle).toBe("My local title");
  await act(async () => {
    await result.current.copy();
  });
  expect(api.createProject.mock.calls[0][0].briefInput).toMatchObject({
    profile: null,
    videoTitle: "My local title",
    overrides: {
      rules: {
        faces: "forbid",
        logos: "forbid",
        prices: "allow",
        additional: ["Keep it calm"],
      },
    },
  });
  api.project.mockResolvedValue(studioProject({ lockVersion: 3 }));
  await act(async () => result.current.reload());
  expect(result.current.draft?.videoTitle).toBe("A real video");
  expect(result.current.saveError).toBeNull();
});
it("does not let an older read overwrite a just-saved project", async () => {
  const { result } = renderHook(() => useStudioProject(projectId), { wrapper });
  await waitFor(() => expect(result.current.draft).not.toBeNull());
  const old = deferred<StudioProject>();
  api.project.mockImplementationOnce(() => old.promise);
  let refresh!: Promise<void>;
  act(() => {
    refresh = result.current.refresh();
  });
  await waitFor(() => expect(api.project).toHaveBeenCalledTimes(2));
  await act(async () => {
    result.current.setDraft({ ...result.current.draft!, videoTitle: "Newest" });
    await result.current.save();
  });
  await act(async () => {
    old.resolve(studioProject());
    await refresh;
  });
  expect(
    client.getQueryData<StudioProject>(
      studioProjectKey(projectId, "clerk:alice"),
    )?.lockVersion,
  ).toBe(2);
  expect(result.current.draft?.videoTitle).toBe("Newest");
});
it("marks the project lists stale after a rename, archive or selection so they refetch", async () => {
  const lists = [["thumbnail-studio", "clerk:alice", "projects", false], ["thumbnail-studio", "clerk:alice", "batch-projects"]];
  const other = ["thumbnail-studio", "clerk:bob", "projects", false];
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  for (const key of [...lists, other]) client.setQueryData(key, { pages: [], pageParams: [] });
  api.patchProject.mockImplementation(async (_id, lock, patch) => ({ ...studioProject({ lockVersion: lock + 1 }), ...patch } as StudioProject));
  const { result } = renderHook(() => useStudioProject(projectId), { wrapper });
  await waitFor(() => expect(result.current.draft).not.toBeNull());
  await act(async () => { await result.current.save({ name: "Renamed" }); });
  for (const key of lists) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
});
