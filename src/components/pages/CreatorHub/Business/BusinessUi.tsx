import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Copy, Info, RefreshCw, Tag, Ticket } from 'lucide-react';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import type { DateRange } from '../../../../types/creatorBusiness';
import { plainApiError } from '../../../../utils/plainApiError';
import HubSelect from '../shared/HubSelect';
import { copyToClipboard } from '../ManagePasses/passHelpers';
import { ResumeSaleButton } from '../ManagePasses/SaleControls';
import type { SaleSubject } from './passActions';
import { formatCount, type NextStep, type SaleState } from './businessFormat';
import { HELP_PATH } from './businessHelp';
import { PRESETS, addDays, customRangeError, periodLabel, utcToday } from './businessPeriod';
import { PAGE_SIZES } from './businessUrlState';
import type { BusinessScope } from './useBusinessScope';
import { button, cx, empty, field, pillClass, segmented, sheen, skeleton, surface, text, type PillTone } from './businessStyles';

/** Web flag for the whole pass area (same flag as the pass screens). */
export const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

export const BUSINESS_BASE = '/creator-hub/business';

// --- Frame -------------------------------------------------------------------

const TABS = [
  { label: 'Overview', to: BUSINESS_BASE, end: true },
  { label: 'Customers', to: `${BUSINESS_BASE}/customers`, end: false },
  { label: 'Passes', to: `${BUSINESS_BASE}/passes`, end: false },
  { label: 'Sources', to: `${BUSINESS_BASE}/sources`, end: false },
  { label: 'Payouts', to: `${BUSINESS_BASE}/payouts`, end: false },
] as const;

/** The one quiet way to the help page ("How Business numbers are counted"). */
export const HelpLink: React.FC<{ search?: string; className?: string }> = ({ search = '', className }) => (
  <Link to={`${HELP_PATH}${search}`} className={cx('inline-flex items-center gap-1.5 rounded-sm text-xs text-gray-400 transition-colors hover:text-white', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50', className)}>
    <Info className="h-3.5 w-3.5" aria-hidden="true" />
    How are these numbers counted?
  </Link>
);

/**
 * The five business screens as tabs (the Analytics tab pills): the sidebar is
 * a drawer on a phone. Links keep the period and channel. The help link sits
 * at the end of the row.
 */
export const BusinessTabs: React.FC<{ search: string; showHelp?: boolean }> = ({ search, showHelp = true }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
    <BusinessTabList search={search} />
    {showHelp && <HelpLink search={search} />}
  </div>
);

const BusinessTabList: React.FC<{ search: string }> = ({ search }) => {
  const location = useLocation();
  return (
    <nav aria-label="Business sections" className="-mx-4 min-w-0 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max items-center gap-1.5">
        {TABS.map((tab) => {
          // The pass list also lives at /creator-hub/passes (old links, Stripe's return address).
          const passesAlias = tab.label === 'Passes' && /^\/creator-hub\/passes\/?$/.test(location.pathname);
          return (
            <li key={tab.to}>
              <NavLink
                to={`${tab.to}${search}`}
                end={tab.end}
                className={({ isActive }) =>
                  cx(
                    'inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50',
                    isActive || passesAlias
                      ? 'bg-[#fa7517]/15 text-[#fa7517] shadow-[0_0_18px_rgba(250,117,23,0.18)] ring-1 ring-inset ring-[#fa7517]/30'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-white',
                  )
                }
                aria-current={passesAlias ? 'page' : undefined}
              >
                {tab.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

interface BusinessHeaderProps {
  title: string;
  count?: number | null;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({ title, count, subtitle, actions }) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
    <div className="min-w-0">
      <h1 className={text.pageTitle}>
        {title}
        {typeof count === 'number' && <span className="ml-2 font-normal tabular-nums text-gray-500">{formatCount(count)}</span>}
      </h1>
      {subtitle && <p className={text.pageSubtitle}>{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

// --- Period and channel ---------------------------------------------------------

interface ToolbarProps {
  scope: BusinessScope;
  /** Channels named by the API (all the creator's channels); the hub's own list fills in while loading. */
  apiChannels?: Array<{ id: number; name: string }>;
  showChannel?: boolean;
  /** The days the API answered for; names the first day of "All time". */
  range?: DateRange | null;
}

/**
 * One period control for every business screen: five presets and a custom
 * from–to, plus the channel filter. Says once, in a short line, what is on
 * screen (that days are UTC days is on the help page and in the custom form).
 */
/** The creator's channels: the API's names when it answered, the hub's own list while it loads. */
function useScopeChannels(apiChannels?: Array<{ id: number; name: string }>): Array<{ id: number; name: string }> {
  const { channels: hubChannels } = useChannelSelection();
  return apiChannels && apiChannels.length ? apiChannels : hubChannels.map((channel) => ({ id: Number(channel.id), name: channel.name }));
}

/** "All my channels" or one channel; nothing when the creator has a single channel. */
export const ChannelFilter: React.FC<{ scope: BusinessScope; apiChannels?: Array<{ id: number; name: string }> }> = ({ scope, apiChannels }) => {
  const channels = useScopeChannels(apiChannels);
  const channelId = scope.scope.channelId;
  if (channels.length <= 1 && channelId === null) return null;
  const selected = channelId === null ? null : channels.find((c) => c.id === channelId) ?? null;
  return (
    <HubSelect
      value={channelId === null ? 'all' : String(channelId)}
      ariaLabel="Channel"
      onChange={(value) => scope.setChannel(value === 'all' ? null : Number(value))}
      options={[
        { value: 'all', label: 'All my channels' },
        ...channels.map((channel) => ({ value: String(channel.id), label: channel.name })),
        ...(channelId !== null && !selected ? [{ value: String(channelId), label: `Channel ${channelId}` }] : []),
      ]}
    />
  );
};

export const BusinessToolbar: React.FC<ToolbarProps> = ({ scope, apiChannels, showChannel = true, range }) => {
  const { period, scope: state, setPreset, setCustom } = scope;
  const channels = useScopeChannels(apiChannels);

  const today = utcToday();
  // All time has no days of its own until the API answers: the custom form starts from the days shown, else the last 30.
  const shownFrom = period.from ?? (range?.allTime ? range.from : addDays(today, -29));
  const shownTo = period.to ?? (range?.allTime ? range.to : today);
  const [customOpen, setCustomOpen] = useState(period.preset === 'custom');
  const [draftFrom, setDraftFrom] = useState(shownFrom);
  const [draftTo, setDraftTo] = useState(shownTo);
  useEffect(() => {
    setDraftFrom(shownFrom);
    setDraftTo(shownTo);
    if (period.preset === 'custom') setCustomOpen(true);
  }, [shownFrom, shownTo, period.preset]);

  const draftError = customRangeError(draftFrom, draftTo, today);
  const label = periodLabel(period, undefined, range?.allTime ? range.from : null);
  const selected = state.channelId === null ? null : channels.find((c) => c.id === state.channelId) ?? null;
  const channelText =
    state.channelId === null
      ? channels.length > 1
        ? `all ${channels.length} channels`
        : 'all your channels'
      : selected
        ? selected.name
        : `channel ${state.channelId}`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="max-w-full overflow-x-auto">
          <div className={segmented.trough} role="group" aria-label="Period">
            {PRESETS.map((preset) => {
              const active = period.preset === preset.value && !customOpen;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCustomOpen(false);
                    setPreset(preset.value);
                  }}
                  className={cx(segmented.chip, 'whitespace-nowrap', active ? segmented.chipActive : segmented.chipIdle)}
                >
                  {preset.short}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={customOpen}
              aria-expanded={customOpen}
              aria-controls="business-custom-range"
              onClick={() => setCustomOpen((open) => !open)}
              className={cx(segmented.chip, 'whitespace-nowrap', customOpen ? segmented.chipActive : segmented.chipIdle)}
            >
              Custom
            </button>
          </div>
        </div>

        {showChannel && <ChannelFilter scope={scope} apiChannels={apiChannels} />}
      </div>

      {customOpen && (
        <form
          id="business-custom-range"
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draftError) setCustom(draftFrom, draftTo);
          }}
        >
          <label className="flex flex-col gap-1">
            <span className={field.label}>From (UTC day)</span>
            <input
              type="date"
              value={draftFrom}
              max={addDays(today, 1)}
              onChange={(event) => setDraftFrom(event.target.value)}
              className={cx(field.input, 'w-[11rem] [color-scheme:dark]')}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={field.label}>To (UTC day)</span>
            <input
              type="date"
              value={draftTo}
              max={addDays(today, 1)}
              onChange={(event) => setDraftTo(event.target.value)}
              className={cx(field.input, 'w-[11rem] [color-scheme:dark]')}
            />
          </label>
          <button type="submit" disabled={Boolean(draftError)} className={button.secondary}>
            Apply
          </button>
          {draftError && draftFrom && draftTo && (
            <p className={cx(field.error, 'w-full')} role="alert">
              {draftError}
            </p>
          )}
        </form>
      )}

      <p className="text-xs text-gray-400">
        <span className="text-gray-200">{label}</span>
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        {channelText}
        {period.preset === 'all' ? '. No earlier period to compare with.' : ''}
      </p>
      {period.error && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-200" role="alert">
          The custom dates in this address could not be used: {period.error} Showing the last 30 days instead.
        </p>
      )}
    </div>
  );
};

// --- Can passes be bought? ----------------------------------------------------------

/**
 * Pass sales are switched off for the whole platform (the API's
 * `salesEnabled: false`): said once, at the top, with the API's reason.
 */
export const SalesOffBanner: React.FC<{ reason: string | null; className?: string }> = ({ reason, className }) => (
  <div
    className={cx('flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3.5', className)}
    role="status"
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
    <div className="min-w-0 text-sm">
      <p className="font-medium text-amber-100">Pass sales are off on BaseTube right now. Nobody can buy a pass until they are back on.</p>
      {reason && <p className="mt-1 text-xs leading-relaxed text-amber-200/90">{reason}</p>}
    </div>
  </div>
);

const SALE_TONE: Record<SaleState['tone'], PillTone> = {
  on_sale: 'positive',
  draft: 'neutral',
  publishing: 'accent',
  failed: 'negative',
  stopped: 'attention',
  blocked: 'attention',
};

/** The state of a pass as a small pill ("On sale", "Sales paused"…), its reason as the tooltip. */
export const SalePill: React.FC<{ state: SaleState; className?: string }> = ({ state, className }) => (
  <span className={pillClass(SALE_TONE[state.tone], className)} title={state.reason ?? undefined}>
    {state.label}
  </span>
);

/** The action that fixes a blocked pass: an app link, "Resume sales" right here, or an email to BaseTube when only BaseTube can fix it. */
export const SaleFixLink: React.FC<{ state: SaleState; pass?: SaleSubject; className?: string }> = ({ state, pass, className }) => {
  const fix = state.fix;
  if (!fix) return null;
  const classes = cx(text.link, className);
  if (fix.kind === 'resume') {
    return pass ? (
      <ResumeSaleButton pass={pass} label={fix.label} className={cx(classes, 'text-left disabled:opacity-60')} />
    ) : (
      <Link to={`/creator-hub/passes/${encodeURIComponent(fix.passId)}`} className={classes}>
        {fix.label}
      </Link>
    );
  }
  return fix.external ? (
    <a href={fix.href} className={classes}>
      {fix.label}
    </a>
  ) : (
    <Link to={fix.href} className={classes}>
      {fix.label}
    </Link>
  );
};

/** On the pass page: why nobody can buy this pass, BaseTube's reason when it paused it, and what fixes it. Nothing when it is on sale. */
export const SaleStateNotice: React.FC<{ state: SaleState; pass?: SaleSubject }> = ({ state, pass }) => {
  if (state.onSale) return null;
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex min-w-0 gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="font-medium text-gray-100">
            Nobody can buy this pass right now <span className="font-normal text-amber-200">· {state.label}</span>
          </p>
          {state.reason && <p className="mt-1 text-xs leading-relaxed text-gray-300">{state.reason}</p>}
          {state.basetubeReason && (
            <p className="mt-1 text-xs leading-relaxed text-gray-300">
              BaseTube&apos;s reason: <span className="text-gray-100">“{state.basetubeReason}”</span>
            </p>
          )}
        </div>
      </div>
      {state.fix && <SaleFixLink state={state} pass={pass} className={cx(button.secondary, '!text-gray-100 hover:!text-white')} />}
    </div>
  );
};

// --- Building blocks --------------------------------------------------------------

interface PanelProps {
  title?: React.ReactNode;
  /** Small line under the title. */
  subtitle?: React.ReactNode;
  /** Shown before the title, in the accent colour. */
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

/** The Analytics card: black glass, hairline border, the faint orange sheen. */
export const Panel: React.FC<PanelProps> = ({ title, subtitle, icon: Icon, action, className, children, id }) => (
  <section className={cx(surface.card, 'p-5 md:p-6', className)} aria-labelledby={id && title ? `${id}-title` : undefined} id={id}>
    <div className={sheen} aria-hidden="true" />
    <div className="relative">
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className={cx(text.cardTitle, 'flex items-center gap-2')}>
                {Icon && <Icon className="h-4 w-4 shrink-0 text-[#fa7517]" aria-hidden="true" />}
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  </section>
);

/** The StatsCard skeleton, same box, same rhythm. */
export const SkeletonTiles: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className={cx('grid grid-cols-1 gap-6 sm:grid-cols-2', count >= 4 ? 'lg:grid-cols-4' : count === 3 ? 'lg:grid-cols-3' : '')} aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-xl border border-gray-800/30 bg-black/50 p-6">
        <div className={cx(skeleton.block, 'h-6 w-6')} />
        <div className={cx(skeleton.line, 'mt-4 w-20')} />
        <div className={cx(skeleton.block, 'mt-2 h-8 w-28')} />
        <div className={cx(skeleton.line, 'mt-2 w-36')} />
      </div>
    ))}
  </div>
);

/** The hero card's skeleton: label, a big number, a chart-sized block. */
export const SkeletonHero: React.FC = () => (
  <div className={cx(surface.card, 'p-5 md:p-6')} aria-hidden="true">
    <div className={cx(skeleton.line, 'w-28')} />
    <div className={cx(skeleton.block, 'mt-4 h-11 w-56')} />
    <div className={cx(skeleton.line, 'mt-3 w-44')} />
    <div className={cx(skeleton.block, 'mt-6 h-48 w-full')} />
  </div>
);

export const SkeletonPanel: React.FC<{ lines?: number; className?: string }> = ({ lines = 5, className }) => (
  <div className={cx(surface.card, 'p-5 md:p-6', className)} aria-hidden="true">
    <div className={cx(skeleton.line, 'w-32')} />
    <div className="mt-5 space-y-3.5">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={cx(skeleton.line, index % 2 ? 'w-4/5' : 'w-full')} />
      ))}
    </div>
  </div>
);

export const SkeletonLines: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-3.5" aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className={cx(skeleton.line, index % 2 ? 'w-3/4' : 'w-full')} />
    ))}
  </div>
);

export const CopyButton: React.FC<{ text: string; label: string; what?: string; className?: string; primary?: boolean }> = ({
  text: value,
  label,
  what = 'Link',
  className,
  primary = false,
}) => (
  <button type="button" onClick={() => void copyToClipboard(value, what)} className={cx(primary ? button.primary : button.secondary, className)}>
    <Copy className="h-4 w-4" aria-hidden="true" />
    {label}
  </button>
);

/** A long value (a link, an email) that never breaks the layout. */
export const LongValue: React.FC<{ children: string; className?: string }> = ({ children, className }) => (
  <span className={cx('block min-w-0 truncate', className)} title={children}>
    {children}
  </span>
);

/** A link in one line, inside a quiet field, ready to copy. */
export const LinkField: React.FC<{ url: string; className?: string }> = ({ url, className }) => (
  <code
    className={cx('block min-w-0 flex-1 truncate rounded-lg border border-gray-800 bg-black/60 px-3 py-2 font-mono text-xs text-gray-300', className)}
    title={url}
  >
    {url}
  </code>
);

// --- States -------------------------------------------------------------------------

/** One icon in a ring, one title, one sentence, one action. */
export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'accent' | 'error';
  role?: 'status' | 'alert';
  className?: string;
}> = ({ icon: Icon, title, body, action, tone = 'accent', role, className }) => (
  <div className={cx(surface.card, className)} role={role}>
    <div className={sheen} aria-hidden="true" />
    <div className={cx('relative', empty.wrapper)}>
      <span className={cx(empty.icon, tone === 'error' && '!text-red-300')}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className={cx(empty.title, 'max-w-full truncate')}>{title}</p>
      {body && <p className={empty.body}>{body}</p>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  </div>
);

export const PassesUnavailable: React.FC = () => (
  <EmptyState
    icon={Ticket}
    role="status"
    title="Content passes are not open yet"
    body="Your earnings, customers and payouts will show here once passes open on BaseTube."
  />
);

interface ErrorPanelProps {
  error: unknown;
  onRetry: () => void;
  /** Offered when the channel in the address is not one of the creator's. */
  onShowAllChannels?: () => void;
  /** Offered when the dates in the address were refused. */
  onResetPeriod?: () => void;
  what?: string;
}

export const BusinessErrorPanel: React.FC<ErrorPanelProps> = ({ error, onRetry, onShowAllChannels, onResetPeriod, what = 'these numbers' }) => {
  const plain = plainApiError(error, `We could not load ${what}. Please try again.`);
  const channelProblem = plain.code === 'CHANNEL_NOT_FOUND' || plain.code === 'INVALID_CHANNEL_ID';
  const dateProblem = plain.code === 'INVALID_DATE' || plain.code === 'INVALID_DATE_RANGE';
  return (
    <EmptyState
      icon={AlertCircle}
      tone="error"
      role="alert"
      title={channelProblem ? 'This channel is not one of yours' : `Couldn't load ${what}`}
      body={plain.message}
      action={
        channelProblem && onShowAllChannels ? (
          <button type="button" onClick={onShowAllChannels} className={button.secondary}>
            Show all my channels
          </button>
        ) : dateProblem && onResetPeriod ? (
          <button type="button" onClick={onResetPeriod} className={button.secondary}>
            Show the last 30 days
          </button>
        ) : (
          <button type="button" onClick={onRetry} className={button.secondary}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        )
      }
    />
  );
};

/** Error panel wired to a business scope (resets the channel / period it blames). */
export const ScopedError: React.FC<{ error: unknown; onRetry: () => void; scope: BusinessScope; what?: string }> = ({ error, onRetry, scope, what }) => (
  <BusinessErrorPanel
    error={error}
    onRetry={onRetry}
    what={what}
    onShowAllChannels={() => scope.setChannel(null)}
    onResetPeriod={() => scope.setPreset('30d')}
  />
);

/** "The latest numbers could not be loaded" over numbers still on screen. */
export const StaleNotice: React.FC<{ onRetry: () => void; what?: string; className?: string }> = ({ onRetry, what = 'numbers', className }) => (
  <p className={cx('rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-200', className)} role="alert">
    The latest {what} could not be loaded; you are seeing the last ones.{' '}
    <button type="button" className="underline underline-offset-2 hover:text-white" onClick={onRetry}>
      Try again
    </button>
  </p>
);

// --- Next step (empty states) ----------------------------------------------------------

interface NextStepPanelProps {
  step: NextStep;
  /** Title when a pass is on sale but nothing sold in the selected days. */
  noSalesTitle?: string;
  /** Link search to keep the period on the Sources helper link. */
  search?: string;
  compact?: boolean;
}

/** Every creator has zero sales today: each empty screen says what to do next, never a fake number. */
export const NextStepPanel: React.FC<NextStepPanelProps> = ({ step, noSalesTitle = 'No purchase in these days yet', search = '', compact = false }) => {
  if (step.kind === 'no_pass') {
    return (
      <EmptyState
        icon={Ticket}
        className={compact ? '[&>div:last-child]:py-8' : undefined}
        title="No pass yet"
        body="A pass sells access to a set of your videos with one link. Your earnings and buyers show up here."
        action={
          <Link to="/creator-hub/create-content-pass" className={button.primary}>
            Create a pass
          </Link>
        }
      />
    );
  }
  if (step.kind === 'draft') {
    const failed = step.status === 'publish_failed';
    return (
      <EmptyState
        icon={Ticket}
        className={compact ? '[&>div:last-child]:py-8' : undefined}
        title={<span title={step.title}>{failed ? `Publishing “${step.title}” failed` : `“${step.title}” is not on sale yet`}</span>}
        body={failed ? 'Open it and publish again. Then you get a link to share.' : 'Finish publishing it to get a link to share.'}
        action={
          <Link to={`/creator-hub/create-content-pass?draft=${encodeURIComponent(step.passId)}`} className={button.primary}>
            Finish publishing
          </Link>
        }
      />
    );
  }
  if (step.kind === 'not_selling') {
    return (
      <EmptyState
        icon={Ticket}
        className={compact ? '[&>div:last-child]:py-8' : undefined}
        title="None of your passes can be bought right now"
        body="Each pass says why, and what fixes it."
        action={
          <Link to={`${BUSINESS_BASE}/passes${search}`} className={button.secondary}>
            Open passes
          </Link>
        }
      />
    );
  }
  return (
    <section className={cx(surface.card, compact ? 'p-5' : 'p-5 md:p-6')} aria-label="Share your pass">
      <div className={sheen} aria-hidden="true" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-md">
          <p className={text.cardTitle}>{noSalesTitle}</p>
          <p className="mt-1 text-sm text-gray-400">
            Share <span className="text-gray-200">“{step.title}”</span> where your audience already is: a video description, your bio, a
            newsletter.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl">
          <LinkField url={step.publicUrl} />
          <CopyButton text={step.publicUrl} label="Copy link" primary />
        </div>
      </div>
      <Link to={`${BUSINESS_BASE}/sources${search}#tag-links`} className={cx(text.link, 'relative mt-3 inline-flex items-center gap-1.5 text-xs')}>
        <Tag className="h-3.5 w-3.5" aria-hidden="true" />
        Tag your link to see where buyers come from
      </Link>
    </section>
  );
};

// --- Paging -------------------------------------------------------------------------

interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  noun?: [string, string];
}

export const Pager: React.FC<PagerProps> = ({ page, pageSize, total, onPage, onPageSize, noun = ['row', 'rows'] }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800/50 px-4 py-3 md:px-5">
      <p className="text-xs tabular-nums text-gray-400">
        {total === 0 ? `No ${noun[1]}` : `${formatCount(start)}–${formatCount(end)} of ${formatCount(total)} ${total === 1 ? noun[0] : noun[1]}`}
      </p>
      <div className="flex items-center gap-2">
        {onPageSize && (
          <HubSelect
            className="!min-w-[8.5rem]"
            value={String(pageSize)}
            ariaLabel="Rows per page"
            onChange={(value) => onPageSize(Number(value))}
            options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} per page` }))}
          />
        )}
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cx(button.icon, 'border border-gray-800')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="text-xs tabular-nums text-gray-300">
          {formatCount(Math.min(page, pages))} / {formatCount(pages)}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className={cx(button.icon, 'border border-gray-800')}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

/** "Figures as of 13 Nov 2026, 14:05", the quiet last line of a screen. */
export const FiguresAsOf: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-gray-400">{children}</p>
);
