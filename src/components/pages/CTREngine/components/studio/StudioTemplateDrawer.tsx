import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutGrid, Search, X } from "lucide-react";
import { studioButton, studioSecondary, StudioSpinner } from "./StudioControls";

/**
 * The template library: every thumbnail made for the base.tube thumbnail pages, with the idea
 * behind it (https://base.tube/thumbnail-templates.json, built with the site). One click fills the
 * brief's visual direction and the exact words on the image; the video title stays the creator's.
 */
export const STUDIO_TEMPLATES_ORIGIN = (process.env.REACT_APP_TEMPLATES_ORIGIN || "https://base.tube").replace(/\/$/, "");

export interface StudioTemplate {
  id: string;
  page: string;
  /** Path on base.tube, e.g. /thumbnails/chess/01-brilliant-move.webp */
  image: string;
  alt: string;
  caption: string;
  layout: string;
  /** The visual direction: what the image shows, in plain words. */
  direction: string;
  /** The words written on the image, or '' when there are none. */
  headline: string;
}
interface TemplateLibrary {
  categories: { id: string; label: string }[];
  pages: { slug: string; name: string; category: string }[];
  templates: StudioTemplate[];
}

async function fetchLibrary(): Promise<TemplateLibrary> {
  const response = await fetch(`${STUDIO_TEMPLATES_ORIGIN}/thumbnail-templates.json`);
  if (!response.ok) throw new Error(`Templates ${response.status}`);
  const body = await response.json();
  if (!body || !Array.isArray(body.templates) || !Array.isArray(body.pages)) throw new Error("Templates unreadable");
  return { categories: Array.isArray(body.categories) ? body.categories : [], pages: body.pages, templates: body.templates };
}

export function useStudioTemplates(enabled = true) {
  return useQuery({ queryKey: ["studio-templates"], queryFn: fetchLibrary, enabled, staleTime: 60 * 60 * 1000, retry: 1 });
}

/** The image resized by base.tube (a small copy for the grid, a large one for the preview). */
export const templateImageUrl = (template: Pick<StudioTemplate, "image">, width: 384 | 1080 = 384) =>
  `${STUDIO_TEMPLATES_ORIGIN}/_next/image?url=${encodeURIComponent(template.image)}&w=${width}&q=75`;

/**
 * The template's visual direction for another video: the words written on the example image are
 * replaced by "(your words)" (`Text "I KNEW IT"` becomes `Text (your words)`), so they are never
 * copied by mistake. The thumbnail's words come from the creator, or are suggested for their video.
 */
export const templateDirection = (template: Pick<StudioTemplate, "direction">) =>
  template.direction.replace(/(\btext\s+)"[^"]*"/gi, "$1(your words)").replace(/"([A-Z0-9][^"a-z]{0,40})"/g, "(your words)");

/** The words of a search, each found in the template's caption, image text, page or direction. */
export function matchesSearch(template: StudioTemplate, pageName: string, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [template.caption, template.alt, template.headline, template.layout, pageName, template.direction].join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** The "Start from a template" button and its drawer. */
export function StudioTemplateButton({ onUse, disabled = false }: { onUse: (template: StudioTemplate) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const library = useStudioTemplates();
  const trigger = useRef<HTMLButtonElement>(null);
  const count = library.data?.templates.length;
  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-orange-500/40 bg-orange-500/[0.05] px-4 py-3 text-left transition-colors hover:border-orange-500/70 hover:bg-orange-500/10 disabled:opacity-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-white">Start from a template</span>
          <span className="block text-xs text-zinc-400">
            {count ? `${count} thumbnail ideas by game and style. Pick one, then make it yours.` : "Thumbnail ideas by game and style. Pick one, then make it yours."}
          </span>
        </span>
      </button>
      {open && (
        <StudioTemplateDrawer
          onClose={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
          onUse={(template) => {
            setOpen(false);
            onUse(template);
          }}
        />
      )}
    </>
  );
}

export function StudioTemplateDrawer({ onClose, onUse }: { onClose: () => void; onUse: (template: StudioTemplate) => void }) {
  const library = useStudioTemplates();
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<StudioTemplate | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const data = library.data;
  const pageNames = useMemo(() => new Map((data?.pages || []).map((p) => [p.slug, p] as const)), [data]);
  const pagesInCategory = (data?.pages || []).filter((p) => category === "all" || p.category === category);
  const shown = (data?.templates || []).filter((template) => {
    const info = pageNames.get(template.page);
    if (category !== "all" && info?.category !== category) return false;
    if (page !== "all" && template.page !== page) return false;
    return matchesSearch(template, info?.name || "", search);
  });
  const pick = (next: string) => {
    setCategory(next);
    setPage("all");
    scroller.current?.scrollTo?.({ top: 0 });
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-[980px] flex-col border-l border-white/10 bg-[#0c0c0f] text-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {chosen ? (
              <button type="button" onClick={() => setChosen(null)} className="mb-1 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All templates
              </button>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Template library</p>
            )}
            <h2 id={titleId} className="truncate text-xl font-semibold">
              {chosen ? chosen.caption : "Start from a template"}
            </h2>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close templates" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {chosen ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <img src={templateImageUrl(chosen, 1080)} alt={chosen.alt} className="aspect-video w-full rounded-xl bg-zinc-900 object-cover ring-1 ring-white/10" />
            <p className="mt-3 text-xs text-zinc-500">{pageNames.get(chosen.page)?.name}{chosen.layout ? ` · ${chosen.layout}` : ""}</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">What this example shows</dt>
                <dd className="mt-1 leading-relaxed text-zinc-200">{chosen.direction}</dd>
              </div>
            </dl>
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-300">
              We copy the look: the layout, the framing and the colours. The words on the image are not copied.
              You then write your video’s title and adapt the highlighted fields to your video.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={studioButton} onClick={() => onUse(chosen)}>
                Use this template
              </button>
              <button type="button" className={studioSecondary} onClick={() => setChosen(null)}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 border-b border-white/10 px-5 py-4 sm:px-6">
              <label className="relative block">
                <span className="sr-only">Search templates</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search: reaction, tier list, Fortnite…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </label>
              <div role="group" aria-label="Kind" className="flex flex-wrap gap-2">
                {[{ id: "all", label: "All" }, ...(data?.categories || [])].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={category === item.id}
                    onClick={() => pick(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${category === item.id ? "border-orange-500 bg-orange-500/15 text-orange-200" : "border-white/10 text-zinc-300 hover:border-white/25 hover:text-white"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {category !== "all" && pagesInCategory.length > 0 && (
                <div role="group" aria-label="Game or style" className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                  {[{ slug: "all", name: "All" }, ...pagesInCategory].map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      aria-pressed={page === item.slug}
                      onClick={() => setPage(item.slug)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${page === item.slug ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {library.isPending && (
                <p role="status" className="flex items-center gap-2 text-sm text-zinc-300">
                  <StudioSpinner /> Loading templates…
                </p>
              )}
              {library.isError && (
                <p role="alert" className="text-sm text-amber-200">
                  The templates could not load. Check your connection and open them again.
                </p>
              )}
              {data && (
                <>
                  <p className="mb-3 text-xs text-zinc-500" aria-live="polite">
                    {shown.length} template{shown.length === 1 ? "" : "s"}
                  </p>
                  {shown.length === 0 ? (
                    <p className="text-sm text-zinc-400">No template matches. Try another word or kind.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {shown.map((template) => (
                        <li key={template.id}>
                          <button type="button" onClick={() => setChosen(template)} className="group block w-full text-left">
                            <span className="relative block aspect-video overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 transition group-hover:ring-orange-500/60">
                              <img src={templateImageUrl(template)} alt={template.alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                            </span>
                            <span className="mt-1.5 block truncate text-xs font-medium text-zinc-200 group-hover:text-white">{template.caption}</span>
                            <span className="block truncate text-[11px] text-zinc-500">{pageNames.get(template.page)?.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  );
}
