import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Info, Route, Wallet } from 'lucide-react';
import { useBusinessPayouts } from '../../../../hooks/useCreatorBusiness';
import type { PayoutLine, StripeAccountState } from '../../../../types/creatorBusiness';
import StripeConnectStrip from '../ManagePasses/StripeConnectStrip';
import { HeroAmount } from './BusinessBlocks';
import { EARNINGS_LABEL, amountUnknownText, earningsWording, formatCount, formatMinor, formatMoment, formatMomentDate, plural } from './businessFormat';
import {
  BUSINESS_BASE,
  BusinessHeader,
  BusinessTabs,
  BusinessToolbar,
  FiguresAsOf,
  NextStepPanel,
  Panel,
  PASSES_ENABLED,
  PassesUnavailable,
  ScopedError,
  SkeletonPanel,
} from './BusinessUi';
import { formatDay } from './businessPeriod';
import { useBusinessScope } from './useBusinessScope';
import { cx, frame, pillClass, surface, text } from './businessStyles';

const money = (line: PayoutLine, minor: number) => formatMinor(minor, line.currency, line.decimals);

/** Reached you / on the way / failed, as one bar the length of the earnings. */
const SplitBar: React.FC<{ line: PayoutLine }> = ({ line }) => {
  const total = line.settled + line.pending + line.failed;
  const pct = (part: number) => (total > 0 ? (part / total) * 100 : 0);
  return (
    <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
      <span className="h-full bg-[#fa7517]" style={{ width: `${pct(line.settled)}%` }} />
      <span className="h-full bg-[#fa7517]/35" style={{ width: `${pct(line.pending)}%` }} />
      <span className="h-full bg-red-400" style={{ width: `${pct(line.failed)}%` }} />
    </div>
  );
};

const Part: React.FC<{ swatch: string; label: string; value: string; note: React.ReactNode; tone?: 'bad' }> = ({ swatch, label, value, note, tone }) => (
  <div className="min-w-0">
    <dt className="flex items-center gap-2 text-sm text-gray-400">
      <span className={cx('h-2.5 w-2.5 shrink-0 rounded-sm', swatch)} aria-hidden="true" />
      {label}
    </dt>
    <dd className={cx('mt-1 truncate text-lg font-semibold tabular-nums', tone === 'bad' ? 'text-red-300' : 'text-white')} title={value}>
      {value}
    </dd>
    <dd className="mt-0.5 text-xs text-gray-400">{note}</dd>
  </div>
);

/** One currency on one rail: the earnings, then where they are. */
const LineBlock: React.FC<{ line: PayoutLine; rail: 'card' | 'crypto'; showCurrency: boolean }> = ({ line, rail, showCurrency }) => {
  const lastReached = rail === 'card' ? line.lastSettledAt : line.lastDistributionAt;
  const quiet: string[] = [];
  if (line.refundedCount > 0) quiet.push(`${plural(line.refundedCount, 'refund', 'refunds')} · ${money(line, line.refundedGross)} (not owed to you)`);
  if (line.disputedCount > 0)
    quiet.push(`${plural(line.disputedCount, 'purchase', 'purchases')} disputed by the bank · ${money(line, line.disputedGross)} (not owed to you)`);
  if (line.withoutAmount > 0) quiet.push(amountUnknownText(line.withoutAmount));
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">
            {EARNINGS_LABEL}
            {showCurrency ? ` in ${line.currency}` : ''}
          </p>
          <div className="mt-1">
            <HeroAmount minor={line.creatorShare} currency={line.currency} decimals={line.decimals} size="value" />
          </div>
        </div>
        <p className="text-sm tabular-nums text-gray-400">{plural(line.salesCount, 'purchase', 'purchases')}</p>
      </div>
      <SplitBar line={line} />
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Part
          swatch="bg-[#fa7517]"
          label="Reached you"
          value={money(line, line.settled)}
          note={`${plural(line.settledCount, 'purchase', 'purchases')}${lastReached ? ` · last on ${formatMomentDate(lastReached)}` : ''}`}
        />
        <Part
          swatch="bg-[#fa7517]/35"
          label="On the way"
          value={money(line, line.pending)}
          note={`${plural(line.pendingCount, 'purchase', 'purchases')}${line.pendingSince ? ` · oldest from ${formatMomentDate(line.pendingSince)}` : ''}`}
        />
        <Part
          swatch="bg-red-400"
          label="Failed"
          value={money(line, line.failed)}
          tone={line.failed > 0 ? 'bad' : undefined}
          note={line.failedCount > 0 ? `${plural(line.failedCount, 'purchase', 'purchases')} did not go through` : 'None'}
        />
      </dl>
      {line.pendingRoutes.length > 0 && (
        <div className={cx(surface.inset, 'mt-4 px-4 py-3 text-xs text-gray-300')}>
          <p className="flex items-center gap-1.5 font-medium text-gray-200">
            <Route className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            On the way means
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-gray-400">
            {line.pendingRoutes.map((r) => (
              <li key={r.route}>{r.label}</li>
            ))}
          </ul>
        </div>
      )}
      {quiet.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-gray-800/50 pt-3 text-xs tabular-nums text-gray-400">
          {quiet.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const accountPill = (state: StripeAccountState) =>
  pillClass(state.canReceiveCardMoney ? 'positive' : state.connected ? 'attention' : 'neutral');

/**
 * Business → Payouts: "where are my earnings", per rail. Built only from what
 * the API stores (no Stripe call); it promises no timing the product does
 * not keep — the API's own notes say what is and is not visible.
 */
const PayoutsPage: React.FC = () => {
  // "Where is my money" reads all time unless a period is chosen.
  const scope = useBusinessScope({ fallback: 'all' });
  const payouts = useBusinessPayouts(scope.apiParams, { enabled: PASSES_ENABLED });
  const data = payouts.data;
  const search = scope.linkSearch();

  let body: React.ReactNode;
  if (!PASSES_ENABLED) {
    body = <PassesUnavailable />;
  } else if (!data && payouts.isLoading) {
    body = (
      <div className="space-y-6" aria-busy="true">
        <SkeletonPanel lines={5} />
        <SkeletonPanel lines={4} />
      </div>
    );
  } else if (!data) {
    body = <ScopedError error={payouts.error} onRetry={() => void payouts.refetch()} scope={scope} what="your payouts" />;
  } else if (data.scope.passCount === 0) {
    body = <NextStepPanel step={{ kind: 'no_pass' }} search={search} />;
  } else {
    const anyCardNotReady = data.card.channels.some((c) => !c.stripeAccount.canReceiveCardMoney);
    const cardLines = data.card.channels.reduce((n, c) => n + c.lines.length, 0);
    body = (
      <div
        className={cx('space-y-6 transition-opacity motion-reduce:transition-none', payouts.isPlaceholderData && 'opacity-60')}
        aria-busy={payouts.isFetching}
      >
        {/* Wide screens: the two ways of being paid side by side. */}
        <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-2">
        <Panel
          title="Card sales"
          icon={CreditCard}
          subtitle="Paid into your own Stripe account. Stripe then pays your bank on its own schedule, which we cannot see."
        >
          <ul className={cx(surface.divider, 'border-t border-gray-800/50')}>
            {data.card.channels.map((channel) => (
              <li key={channel.channelId} className="space-y-5 py-5 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-gray-100" title={channel.name}>
                    {channel.name}
                  </p>
                  <span className={accountPill(channel.stripeAccount)}>{channel.stripeAccount.summary}</span>
                </div>
                {channel.lines.length ? (
                  <div className="space-y-8">
                    {channel.lines.map((line) => (
                      <LineBlock key={line.currency} line={line} rail="card" showCurrency={channel.lines.length > 1} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No card purchase on this channel{data.range ? ' in these days' : ''}.</p>
                )}
              </li>
            ))}
          </ul>
          {anyCardNotReady && (
            <div className="mt-5 space-y-3 border-t border-gray-800/50 pt-5">
              <p className="text-sm text-gray-300">
                Card sales need a finished Stripe account before they can pay you.{' '}
                <Link to={`${BUSINESS_BASE}${search}#selling-readiness`} className={text.link}>
                  See every step
                </Link>
              </p>
              {data.card.channels
                .filter((c) => !c.stripeAccount.canReceiveCardMoney)
                .map((c) => (
                  <div key={c.channelId} className="space-y-1.5">
                    {data.card.channels.length > 1 && <p className="text-xs text-gray-400">{c.name}</p>}
                    <StripeConnectStrip channelId={c.channelId} returnTo="payouts" />
                  </div>
                ))}
            </div>
          )}
          {cardLines === 0 && !anyCardNotReady && <p className="mt-4 text-sm text-gray-400">Your Stripe account is ready. No card purchase yet.</p>}
        </Panel>

        <Panel
          title="Crypto sales (USDC)"
          icon={Wallet}
          subtitle={`Paid by an on-chain split that runs once a day.${
            data.crypto.lastDistributionAt ? ` Last run that paid you: ${formatMoment(data.crypto.lastDistributionAt)}.` : ' Nothing has reached you this way yet.'
          }`}
        >
          <div className="space-y-8 border-t border-gray-800/50 pt-5">
            {data.crypto.lines.length ? (
              data.crypto.lines.map((line) => <LineBlock key={line.currency} line={line} rail="crypto" showCurrency={data.crypto.lines.length > 1} />)
            ) : (
              <p className="text-sm text-gray-400">No crypto purchase{data.range ? ' in these days' : ''}.</p>
            )}
          </div>
          {data.crypto.destinations.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-200">Where crypto sales are paid</p>
              <ul className={cx(surface.divider, 'mt-2')}>
                {data.crypto.destinations.map((d, index) => (
                  <li key={`${d.walletMasked ?? 'none'}-${d.routing ?? 'none'}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-mono text-xs text-gray-100">{d.walletMasked ?? 'No wallet saved'}</span>
                    <span className="text-xs text-gray-400">
                      {d.routingLabel} · {plural(d.passes, 'pass', 'passes')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {data.payoutChoices.length > 0 && (
          <Panel title="How each pass pays you">
            <ul className={surface.divider}>
              {data.payoutChoices.map((choice) => (
                <li key={choice.preference ?? 'none'} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                  <span className="text-gray-100">{choice.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">{plural(choice.passes, 'pass', 'passes')}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {data.notes.length > 0 && (
          <Panel title="Good to know" icon={Info}>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-400">
              {data.notes.map((note) => (
                <li key={note}>{earningsWording(note)}</li>
              ))}
            </ul>
          </Panel>
        )}
        </div>
        <FiguresAsOf>
          {data.range ? `Purchases paid from ${formatDay(data.range.from)} to ${formatDay(data.range.to)} (UTC days).` : 'All purchases since your first pass.'}{' '}
          {formatCount(data.scope.passCount)} {data.scope.passCount === 1 ? 'pass' : 'passes'} counted.
        </FiguresAsOf>
      </div>
    );
  }

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <BusinessHeader title="Payouts" subtitle="Where your earnings are: reached you, on the way, or failed." />
        <BusinessTabs search={search} />
        {PASSES_ENABLED && <BusinessToolbar scope={scope} apiChannels={data?.scope.channels} range={data?.range} />}
        {body}
      </div>
    </div>
  );
};

export default PayoutsPage;
