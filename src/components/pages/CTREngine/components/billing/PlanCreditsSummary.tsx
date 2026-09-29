// "≈ 4 videos left this month" next to the credit balance, and its detail:
// the plan, the subscription credits and when they expire, the other credits.
import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { MySubscription } from '../../../../../types/subscription';
import { planVideosLeftText, shortDate } from '../../../../../hooks/useSubscription';

/** Plan credits are what "videos left" counts; shown for a plan being paid for, or while its credits last. */
export function showsVideosLeft(me: MySubscription | null | undefined): me is MySubscription {
  if (!me) return false;
  const status = me.subscription?.status;
  return me.credits.subscription.available > 0 || status === 'active' || status === 'trialing' || status === 'past_due';
}

/** "360 from your subscription, valid until Oct 31". */
export function subscriptionCreditsLine(me: MySubscription): string {
  const { available, expiresAt } = me.credits.subscription;
  const until = shortDate(expiresAt);
  return `${available.toLocaleString()} from your subscription${until ? `, valid until ${until}` : ''}`;
}

/** The plan detail: plan, subscription credits by expiry, other credits, and where to manage it. */
export function PlanCreditsDetail({ me, onLinkClick }: { me: MySubscription; onLinkClick?: () => void }) {
  const lots = me.credits.subscription.lots.filter((lot) => lot.available > 0);
  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">
      {me.subscription && <p className="font-medium text-white">{me.subscription.planName} plan</p>}
      <p>{subscriptionCreditsLine(me)}</p>
      {lots.length > 1 && (
        <ul className="space-y-0.5 pl-3 text-zinc-500">
          {lots.map((lot) => (
            <li key={lot.expiresAt}>
              {lot.available.toLocaleString()} until {shortDate(lot.expiresAt)}
            </li>
          ))}
        </ul>
      )}
      <p>{me.credits.other.available.toLocaleString()} from packs and gifts, no expiry</p>
      <Link
        to="/ai-thumbnails/settings/subscription"
        onClick={onLinkClick}
        className="inline-block pt-1 font-medium text-[#fb923c] hover:text-orange-300"
      >
        Subscription settings
      </Link>
    </div>
  );
}

/** The sidebar line under the balance; clicking it opens the detail in place. */
export function VideosLeftToggle({ me, onLinkClick }: { me: MySubscription; onLinkClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-md text-left text-xs text-zinc-300 hover:text-white"
      >
        <span>{planVideosLeftText(me)}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={detailId}>
          <PlanCreditsDetail me={me} onLinkClick={onLinkClick} />
        </div>
      )}
    </div>
  );
}
