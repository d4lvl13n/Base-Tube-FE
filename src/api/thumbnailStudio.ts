import api from "./index";
import { createThumbnailStudioApi } from "@basetube/api";
import {
  STUDIO_GENERIC_ERROR_MESSAGES,
  StudioRequestError,
  studioBlobError,
  studioRateLimitError,
  studioRateLimitMessage,
  studioRetryAfterSeconds,
  studioStatusMessage,
  studioTransportMessage,
} from "./studioErrors";
import type { StudioErrorInfo } from "./studioErrors";
import type {
  StudioAsset,
  StudioAssetPurpose,
  StudioCapabilities,
  StudioPage,
  StudioProject,
  StudioProjectSummary,
  StudioProjectPatch,
  StudioBriefInputV1,
  StudioProfile,
  StudioProfileSettings,
  StudioVersion,
  StudioAudit,
  StudioQuoteInput,
  StudioOperation,
  StudioArtifact,
} from "../types/thumbnailStudio";
const BASE = "/api/v1/thumbnail-studio";
interface Envelope<T> {
  success: true;
  data: T;
}
const read = async <T>(path: string, params?: object) =>
  (await api.get<Envelope<T>>(BASE + path, { params })).data.data;
async function exportRequest(request: Promise<{ data: Blob }>): Promise<Blob> {
  try {
    return (await request).data;
  } catch (failure) {
    const rateLimited = studioRateLimitError(failure);
    if (rateLimited) throw rateLimited;
    const data = (failure as { response?: { data?: unknown } }).response?.data;
    if (data instanceof Blob && data.type.includes("json"))
      throw await studioBlobError(data);
    throw failure;
  }
}
/**
 * Uploads, imports and YouTube source reads are limited per account over minutes:
 * a 429 becomes "Too many requests — try again in …" (never a generic failure).
 */
async function limited<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (failure) {
    throw studioRateLimitError(failure) || failure;
  }
}
const post = async <T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
) => (await api.post<Envelope<T>>(BASE + path, body, { headers })).data.data;
export interface StudioChannelContext {
  videos: Array<{
    videoId: string;
    format: "long" | "short" | "unknown";
    formatSource: "provider" | "unknown";
  }>;
  eligibleExperiments: Array<{ experimentId: string; videoIds: string[] }>;
}
export const thumbnailStudioApi = {
  ...createThumbnailStudioApi(api),
  capabilities: () => read<StudioCapabilities>("/capabilities"),
  projects: (params?: { cursor?: string; archived?: boolean }) =>
    read<StudioPage<StudioProjectSummary>>("/projects", params),
  project: (id: string) => read<StudioProject>(`/projects/${id}`),
  createProject: (body: {
    name?: string;
    briefInput: StudioBriefInputV1;
    sourceContext?:
      | { type: "idea" }
      | { scriptAssetId?: string; imageAssetId?: string };
    importedAssetId?: string;
  }) => post<StudioProject>("/projects", body),
  patchProject: async (
    id: string,
    lockVersion: number,
    patch: StudioProjectPatch,
  ) =>
    (
      await api.patch<
        Envelope<StudioProjectSummary & Pick<StudioProject, "currentRevision">>
      >(`${BASE}/projects/${id}`, patch, {
        headers: { "If-Match": String(lockVersion) },
      })
    ).data.data,
  versions: (id: string, cursor?: string) =>
    read<StudioPage<StudioVersion>>(`/projects/${id}/versions`, { cursor }),
  audits: (id: string, cursor?: string) =>
    read<StudioPage<StudioAudit>>(`/projects/${id}/audits`, { cursor }),
  importVersion: (id: string, lockVersion: number, assetId: string) =>
    post<StudioProjectSummary & { version: StudioVersion }>(
      `/projects/${id}/versions/import`,
      { assetId },
      { "If-Match": String(lockVersion) },
    ),
  asset: (id: string) => read<StudioAsset>(`/assets/${id}`),
  /**
   * Multipart with exactly two parts, `purpose` then `file`: the server knows the
   * purpose's limit (script 1 MiB, image 10 MiB) before the file streams, and
   * refuses a third part. The multipart type stops axios from turning the form
   * into JSON (the shared client defaults to application/json); the browser
   * replaces it with the boundary.
   */
  upload: (file: File, purpose: StudioAssetPurpose) => {
    const body = new FormData();
    body.append("purpose", purpose);
    body.append("file", file);
    return limited(() =>
      post<StudioAsset>("/assets", body, { "Content-Type": "multipart/form-data" }),
    );
  },
  assetFromThumbnail: (thumbnailId: number) =>
    limited(() => post<StudioAsset>("/assets/from-thumbnail", { thumbnailId })),
  youtubeSource: (id: string, lockVersion: number, url: string) =>
    limited(() =>
      post<{
        id: string;
        state: "succeeded";
        artifact: Extract<StudioArtifact, { kind: "youtube_source" }>;
      }>(
        `/projects/${id}/youtube-source`,
        { url },
        { "If-Match": String(lockVersion) },
      ),
    ),
  profiles: (params?: { cursor?: string; archived?: boolean }) =>
    read<StudioPage<StudioProfile>>("/profiles", params),
  createProfile: (body: {
    name: string;
    settings: StudioProfileSettings;
    youtubeChannelId?: string | null;
    isDefault?: boolean;
  }) => post<StudioProfile>("/profiles", body),
  patchProfile: async (
    id: string,
    version: number,
    body: Partial<
      Pick<
        StudioProfile,
        "name" | "settings" | "youtubeChannelId" | "isDefault" | "archived"
      >
    >,
  ) =>
    (
      await api.patch<Envelope<StudioProfile>>(`${BASE}/profiles/${id}`, body, {
        headers: { "If-Match": String(version) },
      })
    ).data.data,
  importLegacyProfile: (body: {
    language: string;
    includeFace: boolean;
    includeLogo: boolean;
    styleThumbnailId?: number;
  }) =>
    limited(() =>
      post<{
        settings: StudioProfileSettings;
        warnings: string[];
        importedAssets: StudioAsset[];
      }>("/profiles/legacy-import", body),
    ),
  quote: (body: StudioQuoteInput) =>
    post<StudioOperation>("/operations/quote", body),
  start: (id: string, key: string) =>
    post<StudioOperation>(
      `/operations/${id}/start`,
      {},
      { "Idempotency-Key": key },
    ),
  operation: (id: string) => read<StudioOperation>(`/operations/${id}`),
  channelContext: (auditId: number) =>
    read<StudioChannelContext>(`/channel-audits/${auditId}/context`),
  channelProjects: (
    auditId: number,
    body: {
      selections: Array<{ videoId: string; experimentId: string }>;
      profileId?: string;
    },
    key: string,
  ) =>
    post<{
      projects: StudioProject[];
      review: Array<{
        projectId: string;
        videoId: string;
        suggestedTitle: string | null;
        privateRecommendationExcluded: boolean;
        warnings: string[];
      }>;
    }>(`/channel-audits/${auditId}/projects`, body, { "Idempotency-Key": key }),
  exportVersion: async (
    id: string,
    format: "png" | "jpeg",
    size: "original" | "youtube",
  ) =>
    exportRequest(
      api.get<Blob>(`${BASE}/versions/${id}/export`, {
        params: { format, size },
        responseType: "blob",
      }),
    ),
  exportSelection: async (
    versionIds: string[],
    format: "png" | "jpeg",
    size: "original" | "youtube",
  ) =>
    exportRequest(
      api.post<Blob>(
        `${BASE}/exports`,
        { versionIds, format, size },
        { responseType: "blob" },
      ),
    ),
};
/**
 * The code and a readable message of a failed Studio request. The generic codes of
 * shared services (FORBIDDEN, CONFLICT, UNPROCESSABLE_REQUEST) use the page's own
 * wording; an HTTP failure without a Studio message says what happened and what
 * to do, never the transport's text ("Request failed with status code …",
 * "Network Error"), and neither does an INTERNAL_ERROR's internal text. Errors
 * raised by the page keep their message. `status` is kept for the technical
 * detail shown in development (`StudioErrorDetail`).
 */
export function studioError(error: unknown): StudioErrorInfo {
  if (error instanceof StudioRequestError)
    return { code: error.code, message: error.message };
  const value = error as {
    response?: {
      status?: number;
      headers?: unknown;
      data?: { error?: { code?: string; message?: string } };
    };
    message?: string;
  };
  const response = value?.response;
  const code = response?.data?.error?.code || "NETWORK_ERROR";
  const serverMessage = code === "INTERNAL_ERROR" ? undefined : response?.data?.error?.message;
  const message =
    STUDIO_GENERIC_ERROR_MESSAGES[code] ||
    serverMessage ||
    (response
      ? response.status === 429
        ? studioRateLimitMessage(studioRetryAfterSeconds(response.headers))
        : studioStatusMessage(response.status)
      : studioTransportMessage(error));
  return typeof response?.status === "number" ? { code, message, status: response.status } : { code, message };
}
export async function downloadStudioBlob(blob: Blob, name: string) {
  if (blob.type.includes("json")) throw await studioBlobError(blob);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
