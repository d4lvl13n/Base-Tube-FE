import { useCallback, useEffect, useRef, useState } from "react";
import { useStudioAccount } from "./useStudioAccount";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { studioError, thumbnailStudioApi } from "../api/thumbnailStudio";
import type { StudioErrorInfo } from "../api/studioErrors";
import type {
  StudioBriefInputV1,
  StudioProject,
  StudioProjectPatch,
} from "../types/thumbnailStudio";
export const studioProjectKey = (id: string, account: string) =>
  ["thumbnail-studio", account, "project", id] as const;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
/** Project lists show name, archive state, update time and the chosen image. */
export function invalidateStudioProjectLists(client: QueryClient, account: string) {
  void client.invalidateQueries({ queryKey: ["thumbnail-studio", account, "projects"] });
  void client.invalidateQueries({ queryKey: ["thumbnail-studio", account, "batch-projects"] });
}
export function useStudioProject(id: string) {
  const client = useQueryClient();
  const account = useStudioAccount();
  const query = useQuery({
    queryKey: studioProjectKey(id, account),
    queryFn: async ({ signal }) => {
      const next = await thumbnailStudioApi.project(id);
      if (signal.aborted) throw new Error("Superseded project read");
      const latest = client.getQueryData<StudioProject>(
        studioProjectKey(id, account),
      );
      return latest && latest.lockVersion > next.lockVersion ? latest : next;
    },
    enabled: Boolean(id) && account !== "anonymous",
    retry: false,
  });
  const [draft, setDraftState] = useState<StudioBriefInputV1 | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const draftRef = useRef(draft);
  const persisted = useRef<StudioProject | null>(null);
  const pending = useRef<Promise<StudioProject> | null>(null);
  const loadedId = useRef("");
  useEffect(() => {
    if (
      !query.data ||
      (persisted.current &&
        query.data.lockVersion < persisted.current.lockVersion)
    )
      return;
    if (loadedId.current !== id) {
      loadedId.current = id;
      persisted.current = query.data;
      draftRef.current = clone(query.data.currentRevision.briefInput);
      setDraftState(draftRef.current);
      setError(null);
    } else if (
      !saving &&
      JSON.stringify(draftRef.current) ===
        JSON.stringify(persisted.current?.currentRevision.briefInput)
    ) {
      persisted.current = query.data;
      draftRef.current = clone(query.data.currentRevision.briefInput);
      setDraftState(draftRef.current);
    }
  }, [query.data, id, saving]);
  const setDraft = useCallback((next: StudioBriefInputV1) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);
  const save = useCallback(
    async (extra: StudioProjectPatch = {}): Promise<StudioProject> => {
      if (pending.current) {
        await pending.current;
        return save(extra);
      }
      if (!persisted.current || !draftRef.current)
        throw new Error("Project not loaded");
      if (error?.code === "PROJECT_CHANGED")
        throw new Error("Resolve the project conflict before saving.");
      const run = async () => {
        setSaving(true);
        setError(null);
        try {
          let remaining = extra;
          do {
            const current = persisted.current!;
            const sent = clone(draftRef.current!);
            if (
              JSON.stringify(sent) ===
                JSON.stringify(current.currentRevision.briefInput) &&
              !Object.keys(remaining).length
            )
              return current;
            await client.cancelQueries({
              queryKey: studioProjectKey(id, account),
              exact: true,
            });
            const updated = await thumbnailStudioApi.patchProject(
              id,
              current.lockVersion,
              { ...remaining, briefInput: sent },
            );
            const merged: StudioProject = { ...current, ...updated };
            persisted.current = merged;
            client.setQueryData(studioProjectKey(id, account), merged);
            invalidateStudioProjectLists(client, account);
            // Profile/source application changes the canonical input on the server.
            if (JSON.stringify(draftRef.current) === JSON.stringify(sent)) {
              draftRef.current = clone(updated.currentRevision.briefInput);
              setDraftState(draftRef.current);
            }
            remaining = {};
          } while (
            JSON.stringify(draftRef.current) !==
            JSON.stringify(persisted.current!.currentRevision.briefInput)
          );
          return persisted.current!;
        } catch (failure) {
          setError(studioError(failure));
          throw failure;
        } finally {
          setSaving(false);
        }
      };
      pending.current = run().finally(() => {
        pending.current = null;
      });
      return pending.current;
    },
    [client, id, account, error?.code],
  );
  const dirty = Boolean(
    draft &&
      JSON.stringify(draft) !==
        JSON.stringify(persisted.current?.currentRevision.briefInput),
  );
  useEffect(() => {
    if (!dirty || saving || error) return;
    const timer = setTimeout(() => {
      void save().catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, dirty, saving, error, save]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || saving) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const reload = async () => {
    await pending.current?.catch(() => undefined);
    const next = await thumbnailStudioApi.project(id);
    persisted.current = next;
    setDraft(clone(next.currentRevision.briefInput));
    setError(null);
    client.setQueryData(studioProjectKey(id, account), next);
    invalidateStudioProjectLists(client, account);
  };
  const refresh = useCallback(async () => {
    invalidateStudioProjectLists(client, account);
    await client.invalidateQueries({ queryKey: studioProjectKey(id, account) });
  }, [client, id, account]);
  const copy = async () => {
    const current = persisted.current;
    if (!current || !draftRef.current) throw new Error("Project not loaded");
    const input = clone(draftRef.current);
    // A copy must not silently upgrade the profile snapshot while preserving this local draft.
    input.overrides = {
      ...current.currentRevision.brief,
      ...input.overrides,
    } as StudioBriefInputV1["overrides"];
    input.overrides = {
      language: input.overrides.language,
      text: input.overrides.text,
      rules: {
        ...current.currentRevision.brief.rules,
        ...input.overrides.rules,
      },
      faceAssetId: input.overrides.faceAssetId,
      logoAssetId: input.overrides.logoAssetId,
      styleAssetId: input.overrides.styleAssetId,
    };
    input.styleOverrides = {
      ...current.currentRevision.resolvedStyle,
      ...input.styleOverrides,
    };
    input.profile = null;
    const created = await thumbnailStudioApi.createProject({
      name: `${current.name.slice(0, 190)} (copy)`,
      briefInput: input,
    });
    invalidateStudioProjectLists(client, account);
    return created;
  };
  return {
    ...query,
    draft,
    setDraft,
    save,
    saving,
    dirty,
    saveError: error,
    reload,
    refresh,
    copy,
  };
}
