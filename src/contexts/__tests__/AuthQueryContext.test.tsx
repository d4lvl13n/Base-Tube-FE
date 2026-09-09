import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { AuthQueryProvider, AuthCacheBoundary } from '../AuthQueryContext';
import { useCreatorSales } from '../../hooks/usePass';
let mockClerk: any = { userId: null, sessionId: null };
let mockWeb3: any = { user: null, isAuthenticated: false };
const mockGetSales = jest.fn();
jest.mock('@clerk/clerk-react', () => ({ useAuth: () => mockClerk }));
jest.mock('../AuthContext', () => ({ useAuth: () => mockWeb3 }));
jest.mock('../../api/pass', () => ({ passApi: { getCreatorSales: (...args: unknown[]) => mockGetSales(...args) } }));
let activeClient: QueryClient;
function Sales() {
  activeClient = useQueryClient();
  activeClient.setDefaultOptions({ ...activeClient.getDefaultOptions(), queries: { ...activeClient.getDefaultOptions().queries, gcTime: Infinity } });
  const enabled = Boolean(mockClerk.userId || mockWeb3.user);
  const sales = useCreatorSales({ enabled });
  return <div data-testid="sales">{JSON.stringify(sales.data) || 'empty'}</div>;
}
function App() { return <AuthQueryProvider><AuthCacheBoundary><Sales /></AuthCacheBoundary></AuthQueryProvider>; }
function identity(method: string, user: string | null) {
  localStorage.setItem('auth_method', method);
  mockClerk = method === 'clerk' ? { userId: user, sessionId: user && `session_${user}` } : { userId: null };
  mockWeb3 = method === 'web3' ? { user: user && { id: user }, isAuthenticated: !!user } : { user: null, isAuthenticated: false };
}
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); identity('clerk', null); });
it.each(['clerk', 'web3'])('%s logout/login cannot render A sales to B without a reload', async method => {
  identity(method, 'A'); mockGetSales.mockResolvedValueOnce({ buyerEmail: 'private-A@example.com' });
  const view = render(<App />);
  await screen.findByText(/private-A@example.com/);
  const oldClient = activeClient;
  identity(method, null); view.rerender(<App />);
  expect(screen.queryByText(/private-A@example.com/)).toBeNull();
  let finishB!: (value: any) => void;
  mockGetSales.mockImplementationOnce(() => new Promise(resolve => { finishB = resolve; }));
  identity(method, 'B'); view.rerender(<App />);
  expect(screen.queryByText(/private-A@example.com/)).toBeNull();
  await waitFor(() => expect(finishB).toBeDefined());
  await act(async () => { finishB({ buyerEmail: 'private-B@example.com' }); });
  await screen.findByText(/private-B@example.com/);
  expect(activeClient).not.toBe(oldClient);
  // A mutation callback may still hold A's old client; it cannot write into B.
  act(() => { oldClient.setQueryData(['creator-sales'], { buyerEmail: 'late-A@example.com' }); });
  expect(screen.queryByText(/late-A@example.com/)).toBeNull();
  expect(activeClient.getQueryData(['creator-sales'])).toEqual({ buyerEmail: 'private-B@example.com' });
  oldClient.clear();
});
it('ignores an A query resolving after a direct switch to B', async () => {
  identity('web3', 'A'); let finishA!: (value: any) => void;
  mockGetSales.mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; }));
  const view = render(<App />); await waitFor(() => expect(finishA).toBeDefined());
  const oldClient = activeClient;
  identity('web3', 'B'); mockGetSales.mockResolvedValueOnce({ buyerEmail: 'B@example.com' }); view.rerender(<App />);
  await screen.findByText(/B@example.com/);
  await act(async () => { finishA({ buyerEmail: 'A@example.com' }); });
  expect(screen.queryByText(/^.*A@example.com.*$/)).toBeNull();
  expect(oldClient.getQueryData(['creator-sales'])).toBeUndefined();
  expect(activeClient.getQueryData(['creator-sales'])).toEqual({ buyerEmail: 'B@example.com' });
});
it('an unauthorized event discards the active cache instead of invalidating a different provider', async () => {
  identity('web3', 'A'); mockGetSales.mockResolvedValueOnce({ buyerEmail: 'A@example.com' });
  const view = render(<App />); await screen.findByText(/A@example.com/); const oldClient = activeClient;
  act(() => { identity('web3', null); window.dispatchEvent(new CustomEvent('auth:unauthorized')); });
  view.rerender(<App />);
  expect(screen.queryByText(/A@example.com/)).toBeNull(); expect(activeClient).not.toBe(oldClient);
  await waitFor(() => expect(oldClient.getQueryCache().getAll()).toHaveLength(0));
});

it('anonymous 401 responses do not remount the page or restart its requests', async () => {
  let mounts = 0;
  function PublicPage() {
    React.useEffect(() => { mounts += 1; }, []);
    return <input aria-label="Creator hook" defaultValue="Keep my draft" />;
  }
  render(<AuthQueryProvider><AuthCacheBoundary><PublicPage /></AuthCacheBoundary></AuthQueryProvider>);
  const originalInput = screen.getByLabelText('Creator hook');
  for (let i = 0; i < 3; i += 1) {
    act(() => { window.dispatchEvent(new CustomEvent('auth:unauthorized')); });
  }
  expect(mounts).toBe(1);
  expect(screen.getByLabelText('Creator hook')).toBe(originalInput);
});
