import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateStudioProjectLists, studioProjectKey } from "../../../hooks/useStudioProject";
import AIThumbnailsLayout from "./AIThumbnailsLayout";
import AIThumbnailsSignInOptions from "./components/AIThumbnailsSignInOptions";
import { StudioAuthGate } from "./components/studio/StudioAuthGate";
import useCTREngine from "../../../hooks/useCTREngine";
import { useStudioAccount } from "../../../hooks/useStudioAccount";
import { thumbnailStudioApi, studioError } from "../../../api/thumbnailStudio";
import type { StudioErrorInfo } from "../../../api/studioErrors";
import { StudioErrorText } from "./components/studio/StudioErrorDetail";
import {
  studioButton,
  studioSecondary,
  ThumbnailPreview,
} from "./components/studio/StudioControls";
export default function StudioProjectsPage() {
  const access = useCTREngine();
  const account = useStudioAccount();
  return (
    <AIThumbnailsLayout
      usageAccess={access.usageAccess}
      isLoadingQuota={access.isLoadingQuota}
    >
      <StudioAuthGate
        access={access}
        signedOut={
          <section className="space-y-4 text-white">
            <h1 className="text-3xl font-semibold">Your thumbnail projects</h1>
            <p>Keep your instructions, versions and chosen image together.</p>
            <AIThumbnailsSignInOptions />
          </section>
        }
      >
        <Projects key={account} />
      </StudioAuthGate>
    </AIThumbnailsLayout>
  );
}
function Projects() {
  const account = useStudioAccount();
  const client = useQueryClient();
  // Hidden projects stay out of the default list; they open and work normally.
  const [showHidden, setShowHidden] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const projects = useInfiniteQuery({
    queryKey: ["thumbnail-studio", account, "projects", showHidden],
    queryFn: ({ pageParam }) =>
      thumbnailStudioApi.projects({ archived: showHidden, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    retry: false,
  });
  /** Hide a project from this list, or show it again (the server's archive flag). */
  const setHidden = async (id: string, hidden: boolean) => {
    setChanging(id);
    setError(null);
    try {
      const current = await thumbnailStudioApi.project(id);
      await thumbnailStudioApi.patchProject(id, current.lockVersion, { archived: hidden });
      invalidateStudioProjectLists(client, account);
      void client.invalidateQueries({ queryKey: studioProjectKey(id, account) });
    } catch (failure) {
      setError(studioError(failure));
    } finally {
      setChanging(null);
    }
  };
  return (
    <div className="space-y-6 text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Thumbnail projects</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Start with a video idea. Keep its instructions, image versions,
            audits and final choice in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={studioSecondary} to="/ai-thumbnails/projects/profiles">
            Channel profiles
          </Link>
          <Link className={studioSecondary} to="/ai-thumbnails/projects/batch">
            Work on several videos
          </Link>
        </div>
      </header>
      <Link className={`${studioButton} inline-flex`} to="/ai-thumbnails/generate">
        Create a thumbnail
      </Link>
      {(projects.error || error) && (
        <p role="alert" className="text-red-300">
          <StudioErrorText error={error || studioError(projects.error)} />
        </p>
      )}
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={showHidden}
          onChange={(event) => setShowHidden(event.target.checked)}
        />{" "}
        Show hidden projects
      </label>
      {projects.isPending ? (
        <p role="status" className="text-zinc-400">
          Loading projects…
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.data?.pages
            .flatMap((page) => page.items)
            .map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-white/10 p-4 transition hover:border-orange-500/50"
              >
                <Link
                  className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  to={`/ai-thumbnails/projects/${project.id}`}
                >
                  {project.selectedVersion ? (
                    <ThumbnailPreview
                      version={project.selectedVersion}
                      title={project.name}
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-white/5 text-sm text-zinc-500">
                      No image selected yet
                    </div>
                  )}
                  <h2 className="mt-3 font-semibold">{project.name}</h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    {project.archived ? "Hidden · " : ""}Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  type="button"
                  className="mt-2 text-xs text-zinc-400 underline disabled:opacity-40"
                  disabled={changing === project.id}
                  aria-label={`${project.archived ? "Show in list" : "Hide from list"}: ${project.name}`}
                  onClick={() => void setHidden(project.id, !project.archived)}
                >
                  {project.archived ? "Show in list" : "Hide from list"}
                </button>
              </div>
            ))}
        </div>
      )}
      {projects.data?.pages[0]?.items.length === 0 && (
        <p className="py-12 text-center text-zinc-400">
          Create your first thumbnail to start a saved project.
        </p>
      )}
      {projects.hasNextPage && (
        <button
          className={studioSecondary}
          disabled={projects.isFetchingNextPage}
          onClick={() => projects.fetchNextPage()}
        >
          Load more projects
        </button>
      )}
    </div>
  );
}
