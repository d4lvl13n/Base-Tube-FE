import type { StudioProject, StudioQuoteInput } from "../types/thumbnailStudio";
export function buildStudioBatchQuote(
  projects: StudioProject[],
  counts: Record<string, number>,
  quality: "standard" | "high",
): StudioQuoteInput {
  if (!projects.length || projects.length > 3)
    throw new Error("Choose between one and three projects.");
  if (
    projects.length > 1 &&
    (!projects[0].youtubeChannelId ||
      projects.some(
        (project) => project.youtubeChannelId !== projects[0].youtubeChannelId,
      ))
  )
    throw new Error(
      "Choose videos from the same verified YouTube channel. Add their YouTube links in each project first.",
    );
  // A hidden (archived) project is included: starting its work restores it.
  if (projects.some((project) => !project.currentRevision.brief.videoTitle.trim()))
    throw new Error("Each project needs a video title before creation.");
  const items = projects.flatMap((project) => {
    const count = counts[project.id] || 2;
    if (![1, 2].includes(count))
      throw new Error("Choose one or two concepts per video.");
    return Array.from({ length: count }, (_, index) => ({
      projectId: project.id,
      revisionId: project.currentRevisionId,
      action: "generate" as const,
      input: { conceptIndex: index, conceptCount: count, quality },
    }));
  });
  if (items.length > 6) throw new Error("A batch can create up to six images.");
  return { items };
}
