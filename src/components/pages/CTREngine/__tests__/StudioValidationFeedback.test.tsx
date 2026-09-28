import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OutputWarnings } from "../components/studio/StudioControls";
import { mergeStudioValidationFeedback } from "../components/studio/StudioValidationFeedback";
import { thumbnailStudioApi } from "../../../../api/thumbnailStudio";
import type {
  StudioVersion,
  StudioOutputValidation,
} from "../../../../types/thumbnailStudio";
import type { StudioValidationFeedback } from "@basetube/api";

jest.mock("../../../../hooks/useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    saveValidationFeedback: jest.fn(),
    quote: jest.fn(),
    start: jest.fn(),
  },
  studioError: (error: Error) => ({ code: "ERROR", message: error.message }),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
const feedback = (
  response: StudioValidationFeedback["response"],
  updatedAt = "2026-09-26T12:00:00Z",
): StudioValidationFeedback => ({
  checkCode: "exact_text",
  response,
  createdAt: "2026-09-26T11:00:00Z",
  updatedAt,
});
const version = (
  validation?: StudioOutputValidation | null,
): StudioVersion => ({
  id: "version-one",
  projectId: "project-one",
  revisionId: "revision-one",
  assetId: "asset-one",
  parentVersionId: null,
  operationItemId: null,
  kind: "generation",
  instruction: null,
  editing: null,
  createdAt: "2026-09-26T10:00:00Z",
  validationFeedback: [],
  validation:
    validation === undefined
      ? {
          schemaVersion: 1,
          status: "checked",
          validatorVersion: "test",
          observedText: [],
          checks: [
            {
              code: "exact_text",
              status: "warning",
              expected: "Your words",
              observed: "Other words",
              explanation: "The image text differs from your requested words.",
            },
          ],
        }
      : validation,
});
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  api.saveValidationFeedback.mockImplementation(async (versionId, input) => ({
    versionId,
    validationFeedback: [feedback(input.response)],
  }));
});
afterEach(() => client.clear());
const content = (image: StudioVersion, repeated = false) => (
  <QueryClientProvider client={client}>
    <OutputWarnings version={image} />
    {repeated && <OutputWarnings version={image} />}
  </QueryClientProvider>
);

it("restores persisted feedback from the hydrated server version", () => {
  const image = version();
  image.validationFeedback = [feedback("disputed")];
  render(content(image));
  expect(screen.getByRole("button", { name: "Not an issue" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Issue is real" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByRole("status")).toHaveTextContent("Saved: not an issue.");
  expect(api.saveValidationFeedback).not.toHaveBeenCalled();
});

it("waits for server confirmation and keeps multiple previews in sync without spending credits", async () => {
  let resolve!: (
    value: Awaited<ReturnType<typeof api.saveValidationFeedback>>,
  ) => void;
  api.saveValidationFeedback.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(content(version(), true));
  fireEvent.click(screen.getAllByRole("button", { name: "Issue is real" })[0]);
  await waitFor(() =>
    expect(api.saveValidationFeedback).toHaveBeenCalledWith("version-one", {
      checkCode: "exact_text",
      response: "confirmed",
    }),
  );
  expect(
    screen
      .getAllByRole("button", { name: "Not an issue" })
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
  expect(
    screen
      .getAllByRole("button", { name: "Issue is real" })
      .every((button) => button.getAttribute("aria-pressed") === "false"),
  ).toBe(true);
  resolve({
    versionId: "version-one",
    validationFeedback: [feedback("confirmed")],
  });
  await waitFor(() =>
    expect(
      screen
        .getAllByRole("button", { name: "Issue is real" })
        .every((button) => button.getAttribute("aria-pressed") === "true"),
    ).toBe(true),
  );
  expect(api.quote).not.toHaveBeenCalled();
  expect(api.start).not.toHaveBeenCalled();
});

it("shows a failed save and retries the exact feedback only when requested", async () => {
  api.saveValidationFeedback.mockRejectedValueOnce(
    new Error("Connection lost."),
  );
  render(content(version()));
  fireEvent.click(screen.getByRole("button", { name: "Not an issue" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Your feedback could not be saved. Connection lost.",
  );
  expect(screen.getByRole("button", { name: "Not an issue" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(api.saveValidationFeedback).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Not an issue" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  expect(api.saveValidationFeedback.mock.calls).toEqual([
    ["version-one", { checkCode: "exact_text", response: "disputed" }],
    ["version-one", { checkCode: "exact_text", response: "disputed" }],
  ]);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("does not carry a failed response or retry action to another image version", async () => {
  api.saveValidationFeedback.mockRejectedValueOnce(
    new Error("Connection lost."),
  );
  const view = render(content(version()));
  fireEvent.click(screen.getByRole("button", { name: "Not an issue" }));
  await screen.findByRole("alert");
  view.rerender(content({ ...version(), id: "version-two" }));
  expect(
    screen.queryByRole("button", { name: "Try again" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Not an issue" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  fireEvent.click(screen.getByRole("button", { name: "Issue is real" }));
  await waitFor(() =>
    expect(api.saveValidationFeedback).toHaveBeenLastCalledWith("version-two", {
      checkCode: "exact_text",
      response: "confirmed",
    }),
  );
});

it.each(["pass", "unknown", "unavailable", "absent"] as const)(
  "offers no feedback command for %s validation",
  (status) => {
    const image = version();
    if (status === "absent") image.validation = null;
    else if (status === "unavailable") image.validation!.status = "unavailable";
    else image.validation!.checks[0].status = status;
    render(content(image));
    expect(
      screen.queryByRole("button", { name: "Issue is real" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Not an issue" }),
    ).not.toBeInTheDocument();
    expect(api.saveValidationFeedback).not.toHaveBeenCalled();
  },
);

it("does not let an older project read overwrite a saved answer, and accepts a newer server answer", async () => {
  const image = version();
  image.validationFeedback = [feedback("confirmed", "2026-09-26T10:00:00Z")];
  const view = render(content(image));
  fireEvent.click(screen.getByRole("button", { name: "Not an issue" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Not an issue" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  view.rerender(
    content({ ...image, validationFeedback: [...image.validationFeedback!] }),
  );
  expect(screen.getByRole("button", { name: "Not an issue" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  view.rerender(
    content({
      ...image,
      validationFeedback: [feedback("confirmed", "2026-09-26T13:00:00Z")],
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Issue is real" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
});

it("merges separate warning responses rather than dropping a concurrent saved answer", () => {
  const first = feedback("confirmed");
  const second: StudioValidationFeedback = {
    ...feedback("disputed"),
    checkCode: "forbidden_logo",
  };
  expect(mergeStudioValidationFeedback([first], [second])).toEqual([
    first,
    second,
  ]);
});
