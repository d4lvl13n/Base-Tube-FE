import api from "../../api";
import { thumbnailStudioApi, studioError } from "../../api/thumbnailStudio";
import { StudioRequestError, studioDownloadErrorMessage } from "../../api/studioErrors";
import {
  studioProject,
  studioOperation,
  projectId,
  operationId,
} from "../fixtures/studio";
jest.mock("../../api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const http = api as jest.Mocked<typeof api>;
beforeEach(() => {
  jest.clearAllMocks();
  http.get.mockResolvedValue({
    data: { success: true, data: studioProject() },
  });
  http.post.mockResolvedValue({
    data: { success: true, data: studioOperation() },
  });
  http.patch.mockResolvedValue({
    data: { success: true, data: studioProject() },
  });
});
it("saves complete drafts through the versioned route with If-Match", async () => {
  const brief = studioProject().currentRevision.briefInput;
  await thumbnailStudioApi.patchProject(projectId, 7, { briefInput: brief });
  expect(http.patch).toHaveBeenCalledWith(
    `/api/v1/thumbnail-studio/projects/${projectId}`,
    { briefInput: brief },
    { headers: { "If-Match": "7" } },
  );
});
it("separates quote from start and sends the durable idempotency key", async () => {
  const quote = {
    items: studioOperation().items.map(
      ({ projectId, revisionId, action, input }) => ({
        projectId,
        revisionId,
        action,
        input,
      }),
    ),
  };
  await thumbnailStudioApi.quote(quote);
  expect(http.post).toHaveBeenLastCalledWith(
    "/api/v1/thumbnail-studio/operations/quote",
    quote,
    { headers: undefined },
  );
  await thumbnailStudioApi.start(operationId, "durable-key");
  expect(http.post).toHaveBeenLastCalledWith(
    `/api/v1/thumbnail-studio/operations/${operationId}/start`,
    {},
    { headers: { "Idempotency-Key": "durable-key" } },
  );
});
it("passes only structured handoff selections, never metrics or audit prose", async () => {
  const body = {
    selections: [{ videoId: "abcdefghijk", experimentId: "experiment-one" }],
  };
  await thumbnailStudioApi.channelProjects(42, body, "same-key");
  expect(http.post).toHaveBeenLastCalledWith(
    "/api/v1/thumbnail-studio/channel-audits/42/projects",
    body,
    { headers: { "Idempotency-Key": "same-key" } },
  );
});
it("uses multipart references and exports actual binary response bodies", async () => {
  const file = new File(["source"], "script.txt", { type: "text/plain" });
  await thumbnailStudioApi.upload(file, "script");
  const body = http.post.mock.calls[0][1] as FormData;
  expect(body.get("file")).toBe(file);
  expect(body.get("purpose")).toBe("script");
  const output = new Blob(["jpeg"], { type: "image/jpeg" });
  http.get.mockResolvedValueOnce({ data: output });
  expect(
    await thumbnailStudioApi.exportVersion("version-id", "jpeg", "youtube"),
  ).toBe(output);
  expect(http.get).toHaveBeenLastCalledWith(
    "/api/v1/thumbnail-studio/versions/version-id/export",
    { params: { format: "jpeg", size: "youtube" }, responseType: "blob" },
  );
});
it("saves warning feedback through the shared SDK route and retains its server timestamps", async () => {
  const input = {
    checkCode: "exact_text" as const,
    response: "confirmed" as const,
  };
  const result = {
    versionId: "version-id",
    validationFeedback: [
      {
        ...input,
        createdAt: "2026-09-26T12:00:00Z",
        updatedAt: "2026-09-26T12:00:00Z",
      },
    ],
  };
  http.patch.mockResolvedValueOnce({ data: { success: true, data: result } });
  expect(
    await thumbnailStudioApi.saveValidationFeedback("version-id", input),
  ).toEqual(result);
  expect(http.patch).toHaveBeenCalledWith(
    "/api/v1/thumbnail-studio/versions/version-id/validation-feedback",
    input,
  );
  expect(http.post).not.toHaveBeenCalled();
});
it.each([
  ["FORBIDDEN", 403, "This account cannot do this. Your saved work is unchanged."],
  ["CONFLICT", 409, "This changed in the meantime. Reload the page, then try again."],
  ["UNPROCESSABLE_REQUEST", 422, "The Studio cannot process this request. Your saved work is unchanged."],
])("words the generic %s answer of a shared service readably", (code, status, message) => {
  const failure = { response: { status, data: { success: false, error: { code, message: "Server text" } } }, message: `Request failed with status code ${status}` };
  expect(studioError(failure)).toEqual({ code, message, status });
});
it("never shows the transport's text: an HTTP failure without a Studio message, no answer, a timeout or an internal error", () => {
  expect(studioError({ response: { status: 502, data: "<html>" }, message: "Request failed with status code 502" }))
    .toEqual({ code: "NETWORK_ERROR", message: "The Studio could not answer just now. Your saved work is safe — try again in a moment.", status: 502 });
  expect(studioError({ response: { status: 403, data: {} }, message: "Request failed with status code 403" }).message)
    .toBe("This account cannot do this. Your saved work is unchanged.");
  expect(studioError(Object.assign(new Error("Network Error"), { isAxiosError: true })))
    .toEqual({ code: "NETWORK_ERROR", message: "We could not reach base.tube. Check your connection, then try again." });
  expect(studioError(Object.assign(new Error("timeout of 600000ms exceeded"), { isAxiosError: true, code: "ECONNABORTED" })).message)
    .toBe("This is taking too long to answer. Try again in a moment.");
  expect(studioError({ response: { status: 500, data: { error: { code: "INTERNAL_ERROR", message: "SequelizeDatabaseError: column x" } } } }).message)
    .toBe("The Studio could not answer just now. Your saved work is safe — try again in a moment.");
  // Errors raised by the page keep their own words; a programming error never shows.
  expect(studioError(new Error("Review the brief first.")).message).toBe("Review the brief first.");
  expect(studioError(new TypeError("Cannot read properties of undefined")).message)
    .toBe("The Studio could not answer just now. Your saved work is safe — try again in a moment.");
});
it("names the HTTP status and code for developers only", () => {
  const { studioTechnicalDetail } = jest.requireActual("../../api/studioErrors");
  const { showTechnicalErrors } = jest.requireActual("../../utils/plainApiError");
  expect(studioTechnicalDetail({ code: "STUDIO_UNAVAILABLE", status: 503 })).toBe("HTTP 503 · STUDIO_UNAVAILABLE");
  expect(studioTechnicalDetail({ code: "NETWORK_ERROR" })).toBe("NETWORK_ERROR");
  expect(studioTechnicalDetail(null)).toBeNull();
  // Jest runs with NODE_ENV=test: the detail is never shown there, nor in production.
  expect(showTechnicalErrors()).toBe(false);
});
it("keeps the server's code and advice when an export is refused", async () => {
  const body = { success: false, error: { code: "EXPORT_TOO_LARGE", message: "This PNG exceeds 2 MiB. Export the original PNG or choose JPEG.", details: { suggested: { format: "png", size: "original" } } } };
  http.get.mockRejectedValueOnce({ response: { status: 422, data: new Blob([JSON.stringify(body)], { type: "application/json" }) } });
  const failure = await thumbnailStudioApi.exportVersion("version-id", "png", "youtube").catch(error => error);
  expect(failure).toBeInstanceOf(StudioRequestError);
  expect(failure).toMatchObject({ code: "EXPORT_TOO_LARGE", message: body.error.message, details: body.error.details });
  expect(studioError(failure)).toEqual({ code: "EXPORT_TOO_LARGE", message: body.error.message });
  expect(studioDownloadErrorMessage(failure)).toBe(body.error.message);
  expect(studioDownloadErrorMessage(new Error("Network Error"))).toBe("Could not download this image. Please try again.");
});
describe("request-rate limits (uploads, imports, exports, YouTube source)", () => {
  const limitedBody = (json: boolean) => json
    ? { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Please wait before trying again." } }
    : new Blob([JSON.stringify({ success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Please wait before trying again." } })], { type: "application/json" });
  const limited = (json: boolean, headers: Record<string, string> = { "retry-after": "120" }) => ({ response: { status: 429, headers, data: limitedBody(json) } });
  it.each([
    ["an upload", () => thumbnailStudioApi.upload(new File(["x"], "face.png", { type: "image/png" }), "face"), "post", true],
    ["a thumbnail import", () => thumbnailStudioApi.assetFromThumbnail(7), "post", true],
    ["a legacy profile import", () => thumbnailStudioApi.importLegacyProfile({ language: "en", includeFace: false, includeLogo: false }), "post", true],
    ["a YouTube source read", () => thumbnailStudioApi.youtubeSource("project", 3, "https://youtu.be/abcdefghijk"), "post", true],
    ["a file export", () => thumbnailStudioApi.exportVersion("version-id", "png", "original"), "get", false],
    ["a ZIP export", () => thumbnailStudioApi.exportSelection(["version-id"], "png", "original"), "post", false],
  ] as const)("says to wait after %s is limited, with the wait from the response", async (_label, call, method, json) => {
    (method === "get" ? http.get : http.post).mockRejectedValueOnce(limited(json));
    const failure = await (call as () => Promise<unknown>)().catch(error => error);
    expect(failure).toBeInstanceOf(StudioRequestError);
    expect(failure).toMatchObject({ code: "RATE_LIMIT_EXCEEDED", message: "Too many requests — try again in 2 minutes." });
    expect(studioError(failure).message).toBe("Too many requests — try again in 2 minutes.");
    expect(studioDownloadErrorMessage(failure)).toBe("Too many requests — try again in 2 minutes.");
  });
  it("says to wait a moment when the response gives no wait the page can read", async () => {
    http.get.mockRejectedValueOnce(limited(false, {}));
    const failure = await thumbnailStudioApi.exportVersion("version-id", "png", "original").catch(error => error);
    expect(failure.message).toBe("Too many requests — try again in a moment.");
    expect(studioError({ response: { status: 429, headers: { "retry-after": "30" }, data: {} } }).message).toBe("Too many requests — try again in 30 seconds.");
  });
});
