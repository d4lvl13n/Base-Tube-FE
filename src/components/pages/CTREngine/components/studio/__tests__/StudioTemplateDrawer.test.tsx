import React, { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateGuidedText, ThumbnailBriefForm, type ThumbnailBriefValues } from "../../ThumbnailBriefForm";
import { matchesSearch, templateDirection, templateImageUrl, type StudioTemplate } from "../StudioTemplateDrawer";

const template = (id: string, page: string, caption: string, headline: string, direction: string): StudioTemplate => ({
  id, page, image: `/thumbnails/${id}`, alt: `${caption} thumbnail`, caption, layout: "", direction, headline,
});
const library = {
  version: 1,
  categories: [{ id: "game", label: "Games" }, { id: "style", label: "Creator styles" }],
  pages: [{ slug: "chess", name: "Chess", category: "game" }, { slug: "meme", name: "Meme", category: "style" }],
  templates: [
    template("chess/01.webp", "chess", "Brilliant move", "QUEEN SAC", 'Chess streamer style. A woman in awe beside a board. Text "QUEEN SAC" on top.'),
    template("chess/02.webp", "chess", "Blunder face", "", "A player with head in hands over a lost board."),
    template("meme/01.webp", "meme", "Reaction meme", "NO WAY", "A cartoon cat with huge eyes."),
  ],
};

function Form({ title = "" }: { title?: string }) {
  const [value, setValue] = useState<ThumbnailBriefValues>({ videoTitle: title, creatorHook: "", description: "", direction: "", headline: "OLD WORDS", format: "landscape" });
  // As the pages do: the direction from the template, the words left empty to write.
  return <ThumbnailBriefForm value={value} onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
    onUseTemplate={(t) => setValue((v) => ({ ...v, direction: templateDirection(t), headline: "" }))}
    headlineControl={<TemplateGuidedText filled={Boolean(value.headline.trim())}><label>Exact words<input aria-label="Initial headline" value={value.headline} placeholder="1 to 4 words for your video" onChange={(e) => setValue((v) => ({ ...v, headline: e.target.value }))} /></label></TemplateGuidedText>} />;
}
const show = (title = "") =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Form title={title} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => library }) as unknown as typeof fetch;
});

it("opens the library, filters by kind, page and words, and fills the brief from a template", async () => {
  show("My chess video");
  fireEvent.click(await screen.findByRole("button", { name: /Start from a template/ }));
  expect(global.fetch).toHaveBeenCalledWith("https://base.tube/thumbnail-templates.json");
  const dialog = await screen.findByRole("dialog", { name: "Start from a template" });
  expect(await within(dialog).findByText("3 templates")).toBeInTheDocument();
  // Kind, then the game.
  fireEvent.click(within(dialog).getByRole("button", { name: "Games" }));
  expect(within(dialog).getByText("2 templates")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Chess" }));
  // Words.
  fireEvent.change(within(dialog).getByRole("searchbox", { name: "Search templates" }), { target: { value: "queen" } });
  expect(within(dialog).getByText("1 template")).toBeInTheDocument();
  // Preview, then use it.
  fireEvent.click(within(dialog).getByRole("button", { name: /Brilliant move/ }));
  expect(within(dialog).getByText(/Chess streamer style\. A woman in awe/)).toBeInTheDocument();
  expect(within(dialog).getByText(/The words on the image are not copied/)).toBeInTheDocument();
  expect(within(dialog).getByRole("img", { name: "Brilliant move thumbnail" })).toHaveAttribute("src", "https://base.tube/_next/image?url=%2Fthumbnails%2Fchess%2F01.webp&w=1080&q=75");
  fireEvent.click(within(dialog).getByRole("button", { name: "Use this template" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  // The look is copied, never the example's words.
  expect(screen.getByLabelText("Visual direction")).toHaveValue("Chess streamer style. A woman in awe beside a board. Text (your words) on top.");
  // The words are emptied (even ones left from before) and highlighted with a hint, never the example's.
  expect(screen.getByLabelText("Initial headline")).toHaveValue("");
  expect(screen.getByLabelText("Initial headline").closest("[data-template-guide-wrap]")).not.toBeNull();
  expect(screen.getByText(/Write the words for your thumbnail \(1 to 4 words\).*The example said “QUEEN SAC”: don’t reuse it\./)).toBeInTheDocument();
  // The creator's title is untouched (so not highlighted); the direction is highlighted until edited.
  expect(screen.getByLabelText("Video title or idea")).toHaveValue("My chess video");
  expect(screen.queryByText(/Write your video’s title/)).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Look copied from “Brilliant move”. Fill in the highlighted fields for your video.");
  expect(screen.getByText(/This describes the example’s video/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Visual direction"), { target: { value: "My own scene" } });
  expect(screen.queryByText(/This describes the example’s video/)).not.toBeInTheDocument();
  // The words are still to write.
  expect(screen.getByRole("status")).toBeInTheDocument();
  // The field keeps its place (and the cursor) when the first letter ends the guide.
  const words = screen.getByLabelText("Initial headline");
  words.focus();
  fireEvent.change(words, { target: { value: "C" } });
  expect(screen.getByLabelText("Initial headline")).toBe(words);
  expect(words).toHaveFocus();
  fireEvent.change(words, { target: { value: "CHECKMATE" } });
  expect(screen.queryByText(/Write the words for your thumbnail/)).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("highlights an empty title after a template, until the creator writes one", async () => {
  show();
  fireEvent.click(await screen.findByRole("button", { name: /Start from a template/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(await within(dialog).findByRole("button", { name: /Reaction meme/ }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Use this template" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByText("Write your video’s title. The template only gives the look.")).toBeInTheDocument();
  expect(screen.getByLabelText("Video title or idea")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Video title or idea"), { target: { value: "Cats vs cucumbers" } });
  expect(screen.queryByText(/Write your video’s title/)).not.toBeInTheDocument();
  // The direction is still to adapt.
  expect(screen.getByText(/This describes the example’s video/)).toBeInTheDocument();
});

it("closes with Escape and says when the library cannot load", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
  show();
  fireEvent.click(screen.getByRole("button", { name: /Start from a template/ }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByRole("alert", undefined, { timeout: 3000 })).toHaveTextContent("The templates could not load.");
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("never keeps the example's words in the direction", () => {
  expect(templateDirection({ direction: 'A dunk on the left, bold white text "POSTER DUNK" on the right' })).toBe("A dunk on the left, bold white text (your words) on the right");
  expect(templateDirection({ direction: 'A board, "!!" badge, Text "QUEEN SAC" above' })).toBe('A board, "!!" badge, Text (your words) above');
});

it("matches every word of a search and builds resized image addresses", () => {
  const t = library.templates[0];
  expect(matchesSearch(t, "Chess", "chess queen")).toBe(true);
  expect(matchesSearch(t, "Chess", "chess fortnite")).toBe(false);
  expect(templateImageUrl(t)).toBe("https://base.tube/_next/image?url=%2Fthumbnails%2Fchess%2F01.webp&w=384&q=75");
});
