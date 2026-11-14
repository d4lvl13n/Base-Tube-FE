import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Eye, Mail, Receipt, UserRound, UserX } from 'lucide-react';
import { useBusinessCustomer } from '../../../../hooks/useCreatorBusiness';
import type { CustomerPurchase } from '../../../../types/creatorBusiness';
import { parseApiError } from '../../../../utils/apiError';
import { copyToClipboard } from '../ManagePasses/passHelpers';
import { EARNINGS_LABEL, emailHiddenText, formatCount, formatMinor, formatMoment, formatMomentDate, holdingText, plural, videosOpenedText } from './businessFormat';
import { formatDay } from './businessPeriod';
import {
  BUSINESS_BASE,
  BusinessTabs,
  EmptyState,
  Pager,
  Panel,
  PASSES_ENABLED,
  PassesUnavailable,
  ScopedError,
  SkeletonPanel,
  SkeletonTiles,
} from './BusinessUi';
import { AccessPill, BuyerTypePill, Monogram, PaidToYou } from './customerBits';
import { useBusinessScope } from './useBusinessScope';
import { button, cx, frame, heroGlow, sheen, surface, table, text } from './businessStyles';

const PURCHASES_PAGE_SIZE = 25;

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
    <dt className="shrink-0 text-sm text-gray-400">{label}</dt>
    <dd className="min-w-0 text-right text-sm text-gray-100">{children}</dd>
  </div>
);

/** What happened to one purchase, in words: refund, dispute. */
function purchaseState(p: CustomerPurchase): string[] {
  const lines: string[] = [];
  if (p.refund) {
    const when = p.refund.refundedAt ? ` on ${formatMomentDate(p.refund.refundedAt)}` : '';
    const amount =
      p.refund.amountReturned !== null ? `${formatMinor(p.refund.amountReturned, p.currency, p.decimals)} returned` : 'amount returned not recorded';
    lines.push(`Refunded${when}: ${amount}`);
    lines.push(p.refund.accessRemoved ? 'Access removed' : 'Small refund, access kept');
  }
  if (p.accessState === 'disputed' || p.disputedAt) {
    lines.push(p.disputedAt ? `Disputed by the bank on ${formatMomentDate(p.disputedAt)}` : 'Disputed by the bank');
  }
  return lines;
}

/** The creator's earnings from one purchase; struck through when a refund or dispute took it back. */
const PurchaseEarnings: React.FC<{ p: CustomerPurchase }> = ({ p }) => {
  if (p.proceeds === null) return <span className="text-xs text-gray-400">Amount not recorded</span>;
  const takenBack = p.accessState === 'refunded' || p.accessState === 'disputed';
  return (
    <span className={cx('whitespace-nowrap tabular-nums', takenBack ? 'text-sm text-gray-400 line-through' : 'text-sm font-semibold text-white')}>
      {formatMinor(p.proceeds, p.currency, p.decimals)}
      {takenBack && <span className="sr-only"> (not counted: {p.accessState})</span>}
    </span>
  );
};

/**
 * One customer: who they are (within what the API shares), what they earned
 * you per currency, every purchase with you, and per pass what they opened.
 * No activity log, no play times: only the first day they opened a pass.
 */
const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const scope = useBusinessScope();
  const purchasesPage = Math.max(1, Number(scope.params.get('page')) || 1);
  const query = useBusinessCustomer(PASSES_ENABLED ? customerId : undefined, {
    ...scope.apiParams,
    page: purchasesPage,
    pageSize: PURCHASES_PAGE_SIZE,
  });
  const data = query.data;
  const search = scope.linkSearch();
  const back = (location.state as { back?: string } | null)?.back ?? `${BUSINESS_BASE}/customers${search}`;

  let body: React.ReactNode;
  if (!PASSES_ENABLED) {
    body = <PassesUnavailable />;
  } else if (!data && query.isLoading) {
    body = (
      <div className="space-y-6" aria-busy="true">
        <SkeletonPanel lines={3} />
        <SkeletonTiles count={2} />
        <SkeletonPanel lines={6} />
      </div>
    );
  } else if (!data) {
    const { code } = parseApiError(query.error);
    body =
      code === 'CUSTOMER_NOT_FOUND' ? (
        <EmptyState
          icon={UserX}
          role="alert"
          title="This person has not bought anything from you"
          body={
            scope.scope.channelId !== null ? 'Not on the selected channel, at least. Try all your channels.' : 'The link may be from another account, or out of date.'
          }
          action={
            <>
              {scope.scope.channelId !== null && (
                <button type="button" onClick={() => scope.setChannel(null)} className={button.secondary}>
                  Show all my channels
                </button>
              )}
              <Link to={`${BUSINESS_BASE}/customers${search}`} className={button.ghost}>
                Back to customers
              </Link>
            </>
          }
        />
      ) : (
        <ScopedError error={query.error} onRetry={() => void query.refetch()} scope={scope} what="this customer" />
      );
  } else {
    const c = data.customer;
    const mayEmail = c.canContact && Boolean(c.email);
    const holding = holdingText(c);
    body = (
      <div
        className={cx('space-y-6 transition-opacity motion-reduce:transition-none', query.isPlaceholderData && 'opacity-60')}
        aria-busy={query.isFetching}
      >
        <section className={cx(surface.card, 'p-5 md:p-7')} style={heroGlow} aria-labelledby="customer-name">
          <div className={sheen} aria-hidden="true" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Monogram name={c.displayName} size="lg" />
              <div className="min-w-0">
                <h1 id="customer-name" className="truncate text-2xl font-bold tracking-tight text-white" title={c.displayName}>
                  {c.displayName}
                </h1>
                {c.email ? (
                  <p className="mt-1 truncate text-sm text-gray-300" title={c.email}>
                    {c.email}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">{emailHiddenText(c.emailHidden)}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <AccessPill state={c.accessState} />
                  <BuyerTypePill
                    returning={c.isReturning}
                    title={
                      c.isReturning ? `Had paid you before ${formatDay(data.range.from)}` : `First paid you on or after ${formatDay(data.range.from)}`
                    }
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 md:border-l md:border-gray-800/50 md:pl-6">
              <p className="text-sm text-gray-400">{EARNINGS_LABEL}</p>
              <div className="mt-1">
                <PaidToYou paid={c.paidToYou} size="hero" align="left" />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Refunds and disputes not counted · {scope.scope.channelId === null ? 'all your channels' : 'this channel'}
              </p>
            </div>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 border-t border-gray-800/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-gray-300">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              {c.canContact
                ? `You may email this customer: they agreed at checkout${c.canContactSince ? ` on ${formatMomentDate(c.canContactSince)}` : ''}.`
                : 'You may not email this customer: they have not agreed, or they withdrew it.'}
            </p>
            {mayEmail && (
              <button type="button" onClick={() => void copyToClipboard(c.email as string, 'Email')} className={button.secondary}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy email
              </button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Panel title="With you, all time" icon={UserRound}>
            <dl className={surface.divider}>
              <Fact label="Purchases">{formatCount(c.purchases)}</Fact>
              <Fact label="Passes bought">{plural(c.passesBought, 'pass', 'passes')}</Fact>
              <Fact label="Has access to">
                {holding.main}
                {holding.note && <span className="block text-xs text-amber-200/90">{holding.note}</span>}
              </Fact>
              <Fact label="First purchase">{formatMoment(c.firstPurchaseAt)}</Fact>
              <Fact label="Last purchase">{formatMoment(c.lastPurchaseAt)}</Fact>
              <Fact label="First came from">{c.firstSource.label}</Fact>
            </dl>
          </Panel>

          <Panel title="What they opened" icon={Eye}>
            {data.passes.length ? (
              <ul className="space-y-4">
                {data.passes.map((p) => {
                  const share = p.videosInPass > 0 ? Math.min(100, (p.videosOpened / p.videosInPass) * 100) : 0;
                  return (
                    <li key={p.passId} className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/creator-hub/passes/${p.passId}${search}`}
                            className="block truncate rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
                            title={p.passTitle}
                          >
                            {p.passTitle || 'Untitled pass'}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {p.hasAccess ? 'Has access' : 'No access now'}
                            {p.firstOpenedDay ? ` · first opened ${formatDay(p.firstOpenedDay)} (UTC)` : ''}
                          </p>
                        </div>
                        <p className="shrink-0 text-right text-xs tabular-nums text-gray-200">{videosOpenedText(p.videosOpened, p.videosInPass)}</p>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
                        <div className="h-full rounded-full bg-[#fa7517]/80" style={{ width: `${p.videosOpened > 0 ? Math.max(2, share) : 0}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No pass to show.</p>
            )}
            <p className="mt-4 text-xs text-gray-400">Opened means they asked to play a video. It does not say how long they watched.</p>
          </Panel>
        </div>

        <section className={surface.card} aria-labelledby="customer-purchases">
          <h2 id="customer-purchases" className={cx(text.cardTitle, 'flex items-center gap-2 px-5 pt-5 md:px-6')}>
            <Receipt className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
            Purchases
            <span className="font-normal tabular-nums text-gray-400">{formatCount(data.purchasesPagination.total)}</span>
          </h2>
          <ul className={cx(surface.divider, 'mt-4 border-t border-gray-800/50 md:hidden')}>
            {data.purchases.map((p) => (
              <li key={p.purchaseId} className="space-y-1.5 px-4 py-4 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/creator-hub/passes/${p.passId}${search}`}
                    className="min-w-0 truncate rounded-sm text-sm font-medium text-gray-100 hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
                    title={p.passTitle}
                  >
                    {p.passTitle || 'Untitled pass'}
                  </Link>
                  <PurchaseEarnings p={p} />
                </div>
                <p className="text-gray-400">
                  {formatMoment(p.paidAt)} · {p.rail === 'card' ? 'Card' : 'Crypto (USDC)'}
                  {p.quantity > 1 ? ` · ${formatCount(p.quantity)} passes` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <AccessPill state={p.accessState} />
                  {purchaseState(p).map((line) => (
                    <span key={line} className="text-amber-200/90">
                      {line}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400">
                  From {p.source.label}
                  {p.campaign ? ` · campaign “${p.campaign}”` : ''}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[54rem]">
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Pass</th>
                  <th className={cx(table.th, 'text-right')}>{EARNINGS_LABEL}</th>
                  <th className={table.th}>Paid on</th>
                  <th className={table.th}>Payment</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Source</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {data.purchases.map((p) => (
                  <tr key={p.purchaseId} className={table.row}>
                    <td className={cx(table.td, 'max-w-[16rem]')}>
                      <Link
                        to={`/creator-hub/passes/${p.passId}${search}`}
                        className="block truncate rounded-sm text-sm font-medium text-gray-100 transition-colors hover:text-[#fa7517] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
                        title={p.passTitle}
                      >
                        {p.passTitle || 'Untitled pass'}
                      </Link>
                      {p.quantity > 1 && <p className="text-xs text-gray-400">{formatCount(p.quantity)} passes</p>}
                    </td>
                    <td className={cx(table.td, 'text-right')}>
                      <PurchaseEarnings p={p} />
                    </td>
                    <td className={cx(table.td, 'whitespace-nowrap text-sm tabular-nums text-gray-300')}>{formatMoment(p.paidAt)}</td>
                    <td className={cx(table.td, 'whitespace-nowrap text-sm text-gray-300')}>{p.rail === 'card' ? 'Card' : 'Crypto (USDC)'}</td>
                    <td className={table.td}>
                      <AccessPill state={p.accessState} />
                      {purchaseState(p).map((line) => (
                        <p key={line} className="mt-1 text-[11px] text-amber-200/90">
                          {line}
                        </p>
                      ))}
                    </td>
                    <td className={cx(table.td, 'max-w-[12rem] text-sm text-gray-300')}>
                      {p.source.label}
                      {p.campaign && (
                        <span className="block truncate text-[11px] text-gray-400" title={p.campaign}>
                          Campaign “{p.campaign}”
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.purchasesPagination.total > PURCHASES_PAGE_SIZE ? (
            <Pager
              page={data.purchasesPagination.page}
              pageSize={data.purchasesPagination.pageSize}
              total={data.purchasesPagination.total}
              noun={['purchase', 'purchases']}
              onPage={(next) => scope.update({ page: next > 1 ? next : null })}
            />
          ) : (
            <div className="h-2" aria-hidden="true" />
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <Link to={back} className={cx(button.ghost, '-ml-2.5')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Customers
        </Link>
        <BusinessTabs search={search} />
        {body}
      </div>
    </div>
  );
};

export default CustomerDetailPage;
