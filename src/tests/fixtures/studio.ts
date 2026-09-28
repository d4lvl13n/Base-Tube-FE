import {
  defaultStudioSettings,
  emptyStudioBrief,
  StudioProject,
  StudioOperation,
} from "../../types/thumbnailStudio";
export const projectId = "11111111-1111-4111-8111-111111111111";
export const operationId = "22222222-2222-4222-8222-222222222222";
export function studioProject(
  overrides: Partial<StudioProject> = {},
): StudioProject {
  const input = { ...emptyStudioBrief(), videoTitle: "A real video" };
  const settings = defaultStudioSettings();
  return {
    id: projectId,
    name: "A real video",
    youtubeVideoId: "abcdefghijk",
    youtubeChannelId: "channel-one",
    currentRevisionId: "revision-one",
    selectedVersionId: null,
    lockVersion: 1,
    archived: false,
    createdAt: "2026-09-26T10:00:00Z",
    updatedAt: "2026-09-26T10:00:00Z",
    currentRevision: {
      id: "revision-one",
      projectId,
      sequence: 1,
      briefInput: input,
      brief: {
        ...input,
        language: "en",
        text: { mode: "suggest", value: "" },
        rules: settings.rules,
        faceAssetId: null,
        logoAssetId: null,
        styleAssetId: null,
      },
      resolvedStyle: settings.style,
      profileSnapshot: null,
      sourceContext: {
        type: "idea",
        contentsRead: [],
        transcriptStatus: "unavailable",
      },
      contextHash: "hash",
      createdAt: "2026-09-26T10:00:00Z",
    },
    versions: [],
    audits: [],
    versionsNextCursor: null,
    auditsNextCursor: null,
    activeOperations: [],
    ...overrides,
  };
}
export function studioOperation(
  overrides: Partial<StudioOperation> = {},
): StudioOperation {
  return {
    id: operationId,
    state: "quoted",
    quoteExpiresAt: new Date(Date.now() + 600000).toISOString(),
    startedAt: null,
    finishedAt: null,
    quotedCredits: 18,
    capturedCredits: 0,
    releasedCredits: 0,
    pricing: {} as StudioOperation["pricing"],
    result: null,
    items: [
      {
        id: "item-one",
        projectId,
        revisionId: "revision-one",
        action: "generate",
        input: { conceptCount: 1, conceptIndex: 0, quality: "high" },
        state: "quoted",
        quotedCredits: 18,
        actualCredits: 0,
        artifact: null,
        errorCode: null,
        retryable: false,
        retryMode: null,
        preparedConcept: null,
      },
    ],
    ...overrides,
  };
}
