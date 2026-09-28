import React, { useId, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { thumbnailMediaUrl } from "../../../../../utils/thumbnailMediaUrl";

export interface StudioRefineTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * Step 3 (Refine): the chosen version large, and directly under it a compact
 * toolbar — the tools as tabs (Text, Change something, Audit) and the free
 * actions (Download, Keep this version). Every tab stays mounted, so a typed
 * change survives switching tabs. Stacks on small screens.
 */
export function StudioRefineView({
  imageUrl,
  alt,
  portrait,
  title,
  subtitle,
  onBack,
  tabs,
  toolbar,
  notes,
  activity,
  more,
}: {
  /** The version's signed image URL; empty while it cannot be shown. */
  imageUrl: string;
  alt: string;
  portrait: boolean;
  /** "Version 2". */
  title: string;
  /** What this version asked for, if anything. */
  subtitle?: string | null;
  onBack: () => void;
  tabs: StudioRefineTab[];
  /** Download and "Keep this version". */
  toolbar: React.ReactNode;
  /** Short notes about this version (checks, earlier instructions). */
  notes?: React.ReactNode;
  /** Work running on this version, next to it. */
  activity?: React.ReactNode;
  /** Secondary free actions (previous version, compare, style reference). */
  more?: React.ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const move = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  };
  return (
    <section aria-label="Refine this version" className="studio-refine space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to concepts
        </button>
        <h2 tabIndex={-1} className="text-lg font-semibold text-white focus:outline-none">{title}</h2>
        {subtitle && <p className="min-w-0 flex-1 truncate text-xs text-zinc-500" title={subtitle}>{subtitle}</p>}
      </div>
      <div className="flex justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {imageUrl
          ? <img src={thumbnailMediaUrl(imageUrl)} alt={alt} className={`block object-contain ${portrait ? "max-h-[78vh] w-auto" : "max-h-[72vh] w-full"}`} />
          : <p className="flex aspect-video w-full items-center justify-center p-6 text-sm text-zinc-400">Preview unavailable. You can still download or keep this version.</p>}
      </div>
      {notes}
      <div className="rounded-2xl border border-white/10 bg-[#111113]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-2">
          <div role="tablist" aria-label="Refine tools" className="flex flex-wrap gap-1">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { tabRefs.current[tab.id] = element; }}
                type="button"
                role="tab"
                id={`${base}-tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls={`${base}-panel-${tab.id}`}
                tabIndex={active === tab.id ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(event) => move(event, index)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${active === tab.id ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${base}-panel-${tab.id}`}
            aria-labelledby={`${base}-tab-${tab.id}`}
            hidden={active !== tab.id}
            className="p-4"
          >
            {tab.content}
          </div>
        ))}
      </div>
      {activity}
      {more}
    </section>
  );
}
