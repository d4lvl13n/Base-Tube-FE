import { buildStudioBatchQuote } from "../studioBatch";
import { studioProject } from "../../tests/fixtures/studio";
it("builds at most two concepts per video and six in total with their saved revisions", () => {
  const projects = [1, 2, 3].map((n) =>
    studioProject({ id: String(n), currentRevisionId: `revision-${n}` }),
  );
  const quote = buildStudioBatchQuote(projects, {}, "high");
  expect(quote.items).toHaveLength(6);
  expect(quote.items[2]).toMatchObject({
    projectId: "2",
    revisionId: "revision-2",
    input: { conceptIndex: 0, conceptCount: 2 },
  });
});
it("rejects mixed or unverified channels before any quote", () => {
  expect(() =>
    buildStudioBatchQuote(
      [
        studioProject(),
        studioProject({ id: "two", youtubeChannelId: "other" }),
      ],
      {},
      "high",
    ),
  ).toThrow(/same verified/);
  expect(() =>
    buildStudioBatchQuote(
      [
        studioProject({ youtubeChannelId: null }),
        studioProject({ id: "two", youtubeChannelId: null }),
      ],
      {},
      "high",
    ),
  ).toThrow(/same verified/);
});
it("rejects oversized batches, invalid counts and empty briefs, and includes hidden projects", () => {
  expect(() =>
    buildStudioBatchQuote(
      Array.from({ length: 4 }, (_, i) => studioProject({ id: String(i) })),
      {},
      "high",
    ),
  ).toThrow(/three/);
  const project = studioProject();
  expect(() =>
    buildStudioBatchQuote([project], { [project.id]: 3 }, "high"),
  ).toThrow(/one or two/);
  // A hidden (archived) project is priced like any other: starting its work restores it.
  expect(buildStudioBatchQuote([studioProject({ archived: true })], {}, "high").items).toHaveLength(2);
  project.currentRevision.brief.videoTitle = "";
  expect(() => buildStudioBatchQuote([project], {}, "high")).toThrow(/title/);
});
