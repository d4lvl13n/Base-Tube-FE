import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Coins } from "lucide-react";
import { BuyCreditsModal } from "../BuyCreditsModal";
import { studioButton, studioSecondary } from "./StudioControls";
import { StudioErrorDetail } from "./StudioErrorDetail";
import { studioCreditsLabel } from "../../../../../utils/studioPricing";
import type { StudioActionState } from "../../../../../hooks/useStudioOperation";
import {
  clearPendingPaidAction,
  PENDING_ACTION_EVENT,
  readPendingPaidAction,
  type PendingPaidAction,
} from "../../../../../utils/studioDraft";

/**
 * A priced button inside a credits scope reports whether the credits stop it;
 * the scope then shows one notice for the whole tool area. `short`: the balance
 * does not cover the price; `refused`: the server said so (402) while the
 * balance read looked enough.
 */
type Shortfall = "short" | "refused" | null;
type ShortfallReport = (id: string, shortfall: Shortfall, action?: PendingPaidAction) => void;
const ShortfallContext = createContext<ShortfallReport | null>(null);

/** "Not enough credits — you have Y", with a real button that opens the credit packs. */
function CreditsNotice({ availableCredits, onBuy, className = "" }: {
  availableCredits?: number;
  onBuy: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[.06] px-3 py-2 text-sm text-amber-100 ${className}`}>
      <span className="inline-flex items-center gap-2">
        <Coins className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        {availableCredits === undefined ? "Not enough credits" : `Not enough credits — you have ${availableCredits}`}
      </span>
      <button type="button" className={`${studioButton} px-3 py-1.5`} onClick={onBuy}>
        Buy credits
      </button>
    </div>
  );
}

/**
 * One tool area (a Studio step, the create bar, a batch). Its priced buttons
 * stay disabled with their price when the balance does not cover them, and the
 * area shows a single "Not enough credits — you have Y · Buy credits" notice
 * instead of one under every button.
 */
export function StudioCreditsScope({ availableCredits, children, noticeClassName }: {
  availableCredits?: number;
  children: React.ReactNode;
  noticeClassName?: string;
}) {
  const [shortfalls, setShortfalls] = useState<
    Readonly<Record<string, { shortfall: Exclude<Shortfall, null>; action?: PendingPaidAction }>>
  >({});
  const [buying, setBuying] = useState(false);
  const report = useCallback<ShortfallReport>((id, value, action) => {
    setShortfalls((previous) => {
      const old = previous[id];
      if ((old?.shortfall ?? null) === value && old?.action?.id === action?.id && old?.action?.credits === action?.credits && old?.action?.label === action?.label)
        return previous;
      const next = { ...previous };
      if (value) next[id] = { shortfall: value, action };
      else delete next[id];
      return next;
    });
  }, []);
  const entries = Object.values(shortfalls);
  const reasons = entries.map((entry) => entry.shortfall);
  // The action to offer again after paying: the one the server refused (it was
  // clicked), else the first one the balance does not cover.
  const pendingAction =
    (entries.find((entry) => entry.shortfall === "refused") ?? entries[0])?.action ?? null;
  return (
    <ShortfallContext.Provider value={report}>
      {reasons.length > 0 && (
        <CreditsNotice
          // The count only when the balance itself is what stops a button.
          availableCredits={reasons.includes("short") ? availableCredits : undefined}
          onBuy={() => setBuying(true)}
          className={noticeClassName}
        />
      )}
      {children}
      {createPortal(
        <BuyCreditsModal isOpen={buying} onClose={() => setBuying(false)} pendingAction={pendingAction} availableCredits={availableCredits} />,
        document.body,
      )}
    </ShortfallContext.Provider>
  );
}

/**
 * The priced action this screen was waiting on when the creator left to get
 * credits (studioDraft `rememberPendingPaidAction`), if it is this one. Read on
 * load (back from Stripe) and when an upgrade in place writes it.
 */
function usePendingPaidAction(actionId: string) {
  const [pending, setPending] = useState(() => readPendingPaidAction(window.location.pathname));
  useEffect(() => {
    const reread = () => setPending(readPendingPaidAction(window.location.pathname));
    window.addEventListener(PENDING_ACTION_EVENT, reread);
    return () => window.removeEventListener(PENDING_ACTION_EVENT, reread);
  }, []);
  const consume = useCallback(() => {
    clearPendingPaidAction();
    setPending(null);
  }, []);
  return { pending: pending && pending.id === actionId ? pending : null, consume };
}

/**
 * One click on a button that shows its price ("Generate 2 concepts · 30
 * credits", "Apply text · free"): the click quotes and starts the work. The
 * current shared balance decides before the click; a shortfall is told once by
 * the surrounding StudioCreditsScope (or here, outside any scope). A refusal,
 * or the rare changed price with its single confirmation, shows right below.
 */
export function StudioPaidAction({
  label,
  credits,
  onRun,
  disabled = false,
  working = false,
  workingLabel = "Starting…",
  availableCredits,
  unavailable = null,
  state,
  onConfirm,
  confirmLabel,
  secondary = false,
  type = "button",
  buttonClassName,
  className = "space-y-2",
  icon,
  children,
  actionKey,
}: {
  label: string;
  /** The price on the button; 0 reads "free"; null shows no price. */
  credits: number | null;
  onRun: () => void;
  /** Nothing to send yet, or the page is busy. */
  disabled?: boolean;
  /** This click is being handled. */
  working?: boolean;
  workingLabel?: string;
  /** Current shared balance (useStudioBalance); undefined while unknown. */
  availableCredits?: number;
  /** Why new work cannot start right now (paused or unavailable). */
  unavailable?: string | null;
  /** This action's refusal or changed price (useStudioOperation `actions[key]`). */
  state?: StudioActionState;
  /** Starts the work at its changed price. */
  onConfirm?: () => void;
  /** The verb on the changed-price button, for example "Generate". */
  confirmLabel?: string;
  secondary?: boolean;
  type?: "button" | "submit";
  buttonClassName?: string;
  /** The wrapper; `contents` lets the button and notices join a parent flex row. */
  className?: string;
  icon?: React.ReactNode;
  /** What the work changes and keeps, shown above the button. */
  children?: React.ReactNode;
  /**
   * The action's key on its page (useStudioOperation `actions[key]`): after
   * the creator gets credits for it, this button is offered again.
   * Defaults to the label.
   */
  actionKey?: string;
}) {
  const [buyingCredits, setBuyingCredits] = useState(false);
  const scope = useContext(ShortfallContext);
  const id = useId();
  const short =
    credits !== null &&
    credits > 0 &&
    availableCredits !== undefined &&
    availableCredits < credits;
  const problem = state?.problem;
  const priceChange = state?.priceChange;
  const resumeId = actionKey ?? label;
  const { pending, consume } = usePendingPaidAction(resumeId);
  // Back with more credits than when the creator left: this action is offered
  // again as its one priced button. It never starts without the click.
  const arrived =
    pending !== null &&
    !short &&
    availableCredits !== undefined &&
    (pending.availableBefore === null || availableCredits > pending.availableBefore);
  // The balance, or the server (402), says the credits do not cover it.
  const shortfall: Shortfall = short ? "short" : problem?.kind === "credits" && !arrived ? "refused" : null;
  useEffect(() => {
    scope?.(id, shortfall, { id: resumeId, label, credits });
  }, [scope, id, shortfall, resumeId, label, credits]);
  const button = useRef<HTMLButtonElement>(null);
  const shown = useRef(false);
  useEffect(() => {
    if (!arrived || shown.current) return;
    shown.current = true;
    button.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [arrived]);
  const click = () => {
    if (pending) consume();
    if (type !== "submit") onRun();
  };
  useEffect(() => () => {
    scope?.(id, null);
  }, [scope, id]);
  return (
    <div className={className}>
      {children}
      {arrived && (
        <p role="status" className="basis-full flex items-center gap-2 text-sm text-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          Your credits arrived —
        </p>
      )}
      <button
        ref={button}
        type={type}
        className={`${buttonClassName || (secondary ? studioSecondary : studioButton)}${arrived ? " ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-[#09090B]" : ""}`}
        disabled={disabled || working || short || Boolean(unavailable)}
        onClick={click}
      >
        {icon}
        {working
          ? workingLabel
          : credits === null
            ? label
            : `${label} · ${studioCreditsLabel(credits)}`}
      </button>
      {shortfall && !scope && (
        <>
          <CreditsNotice availableCredits={short ? availableCredits : undefined} onBuy={() => setBuyingCredits(true)} className="basis-full" />
          {/* Outside any form or fieldset around the button (the create form, the editor). */}
          {createPortal(
            <BuyCreditsModal
              isOpen={buyingCredits}
              onClose={() => setBuyingCredits(false)}
              pendingAction={{ id: resumeId, label, credits }}
              availableCredits={availableCredits}
            />,
            document.body,
          )}
        </>
      )}
      {unavailable && (
        <p role="status" className="basis-full text-xs text-amber-200">
          {unavailable}
        </p>
      )}
      {problem && problem.kind !== "credits" && !(unavailable && problem.kind === "unavailable") && (
        <p role="alert" className="basis-full text-xs text-red-200">
          {problem.message}
          <StudioErrorDetail error={problem} />
        </p>
      )}
      {priceChange && onConfirm && !working && (
        <p role="status" className="basis-full flex flex-wrap items-center gap-2 text-sm text-amber-200">
          {credits === null
            ? `This costs ${studioCreditsLabel(priceChange.credits)} —`
            : `The price is now ${studioCreditsLabel(priceChange.credits)} —`}
          <button
            type="button"
            className={studioSecondary}
            disabled={disabled || Boolean(unavailable) || (availableCredits !== undefined && availableCredits < priceChange.credits)}
            onClick={onConfirm}
          >
            {confirmLabel || label}
          </button>
        </p>
      )}
    </div>
  );
}
