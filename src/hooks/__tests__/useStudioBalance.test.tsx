import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ctrApi } from '../../api/ctr';
import { invalidateStudioBalance, notifyStudioUsageChanged, useStudioBalance } from '../useStudioBalance';
jest.mock('../../api/ctr', () => ({ ctrApi: { getQuota: jest.fn() } }));
const getQuota = ctrApi.getQuota as jest.Mock;
const credits = (available: number) => ({ mode: 'credits', creditInfo: { available, balance: available, reserved: 0 }, pricing: null });
class TestChannel {
  static instances: TestChannel[] = [];
  onmessage?: (event: { data: unknown }) => void;
  postMessage = jest.fn(); close = jest.fn();
  constructor(public name: string) { TestChannel.instances.push(this); }
}
const pending = () => { let resolve!: (value: any) => void; const promise = new Promise<any>(done => { resolve = done; }); return { promise, resolve }; };
function Balance({ userId = 'clerk:alice', label = 'balance' }: {userId?: string; label?: string}) {
  const state = useStudioBalance(userId);
  return <output aria-label={label}>{state.usageAccess?.mode === 'credits' ? state.usageAccess.creditInfo.available : 'loading'}</output>;
}
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks(); TestChannel.instances = [];
  Object.defineProperty(global, 'BroadcastChannel', { configurable: true, writable: true, value: TestChannel });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  getQuota.mockResolvedValue(credits(100));
});
afterEach(() => client.clear());
const wrap = (children: React.ReactNode) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
it('shares one read and one cross-tab subscription across Studio consumers', async () => {
  render(wrap(<><Balance /><Balance label="sidebar" /></>));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('100'));
  expect(getQuota).toHaveBeenCalledTimes(1);
  expect(TestChannel.instances).toHaveLength(1);
  getQuota.mockResolvedValue(credits(82));
  act(() => notifyStudioUsageChanged());
  await waitFor(() => expect(screen.getByLabelText('sidebar')).toHaveTextContent('82'));
  expect(TestChannel.instances[0].postMessage).toHaveBeenCalledWith({ userId: 'clerk:alice', refresh: true });
});
it('rejects an older HTTP response arriving after a newer settled balance', async () => {
  render(wrap(<Balance />));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('100'));
  const older = pending(); const newer = pending();
  getQuota.mockImplementationOnce(() => older.promise).mockImplementationOnce(() => newer.promise);
  let oldRefresh!: Promise<void>; let newRefresh!: Promise<void>;
  act(() => { oldRefresh = invalidateStudioBalance(client, 'clerk:alice'); });
  await waitFor(() => expect(getQuota).toHaveBeenCalledTimes(2));
  act(() => { newRefresh = invalidateStudioBalance(client, 'clerk:alice'); });
  await waitFor(() => expect(getQuota).toHaveBeenCalledTimes(3));
  await act(async () => { newer.resolve(credits(50)); await newRefresh; });
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('50'));
  await act(async () => { older.resolve(credits(90)); await oldRefresh; });
  expect(screen.getByLabelText('balance')).toHaveTextContent('50');
});
it('refreshes the matching account from another tab and ignores another account', async () => {
  render(wrap(<Balance />));
  await waitFor(() => expect(getQuota).toHaveBeenCalledTimes(1));
  getQuota.mockResolvedValue(credits(70));
  act(() => TestChannel.instances[0].onmessage?.({ data: { userId: 'clerk:bob', refresh: true } }));
  expect(getQuota).toHaveBeenCalledTimes(1);
  act(() => TestChannel.instances[0].onmessage?.({ data: { userId: 'clerk:alice', refresh: true } }));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('70'));
  expect(TestChannel.instances[0].postMessage).not.toHaveBeenCalled();
});
it('uses storage signals when BroadcastChannel is unavailable and refreshes on focus', async () => {
  Object.defineProperty(global, 'BroadcastChannel', { value: undefined });
  render(wrap(<Balance />));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('100'));
  getQuota.mockResolvedValue(credits(64));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'thumbnail-studio-usage', newValue: JSON.stringify({ userId: 'clerk:alice', refresh: true }) })));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('64'));
  getQuota.mockResolvedValue(credits(45));
  act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('45'));
});
it('does not display the previous account balance after switching accounts', async () => {
  const view = render(wrap(<Balance />));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('100'));
  const bob = pending(); getQuota.mockReturnValueOnce(bob.promise);
  view.rerender(wrap(<Balance userId="clerk:bob" />));
  expect(screen.getByLabelText('balance')).toHaveTextContent('loading');
  await act(async () => bob.resolve(credits(7)));
  await waitFor(() => expect(screen.getByLabelText('balance')).toHaveTextContent('7'));
});
function BalanceState() {
  const state = useStudioBalance('clerk:alice');
  const available = state.usageAccess?.mode === 'credits' ? state.usageAccess.creditInfo.available : 'none';
  return <output aria-label="state">{`${available}|${state.isLoadingQuota ? 'loading' : 'idle'}|${state.balanceError ? 'error' : 'ok'}`}</output>;
}
it('keeps the last balance, without loading state or error, during a failing background refresh', async () => {
  render(wrap(<BalanceState />));
  expect(screen.getByLabelText('state')).toHaveTextContent('none|loading|ok');
  await waitFor(() => expect(screen.getByLabelText('state')).toHaveTextContent('100|idle|ok'));
  getQuota.mockRejectedValue(new Error('Network Error'));
  act(() => notifyStudioUsageChanged());
  await waitFor(() => expect(getQuota).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText('state')).toHaveTextContent('100|idle|ok');
  await waitFor(() => expect(client.getQueryState(['thumbnail-studio', 'usage', 'clerk:alice'])?.status).toBe('error'), { timeout: 4000 });
  expect(screen.getByLabelText('state')).toHaveTextContent('100|idle|ok');
});
it('reports a first-load failure so the page can explain the missing balance', async () => {
  getQuota.mockRejectedValue(new Error('Network Error'));
  render(wrap(<BalanceState />));
  await waitFor(() => expect(screen.getByLabelText('state')).toHaveTextContent('none|idle|error'), { timeout: 4000 });
});
