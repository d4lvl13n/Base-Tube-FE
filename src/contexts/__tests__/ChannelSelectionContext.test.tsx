import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChannelSelectionProvider, useChannelSelection } from '../ChannelSelectionContext';
import { getMyChannels } from '../../api/channel';

let mockAccount = { account: 'anonymous', resolved: true };
jest.mock('../../hooks/useStudioAccount', () => ({ useStudioAccountState: () => mockAccount }));
jest.mock('../../api/channel', () => ({ getMyChannels: jest.fn() }));
const getChannels = getMyChannels as jest.Mock;

function Consumer() {
  const { channels } = useChannelSelection();
  return <output>{channels.map(channel => channel.name).join(',')}</output>;
}

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); mockAccount = { account: 'anonymous', resolved: true }; });

test('does not request private channels while signed out or restoring authentication', async () => {
  const client = new QueryClient();
  const tree = () => <QueryClientProvider client={client}><ChannelSelectionProvider><Consumer /></ChannelSelectionProvider></QueryClientProvider>;
  const view = render(tree());
  await act(async () => undefined);
  expect(getChannels).not.toHaveBeenCalled();
  mockAccount = { account: 'clerk:restoring', resolved: false };
  view.rerender(tree());
  await act(async () => undefined);
  expect(getChannels).not.toHaveBeenCalled();
  view.unmount(); client.clear();
});

test('loads channels after authentication resolves and keeps separate account caches', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  getChannels.mockResolvedValue([{ id: '1', name: 'First channel' }]);
  const tree = () => <QueryClientProvider client={client}><ChannelSelectionProvider><Consumer /></ChannelSelectionProvider></QueryClientProvider>;
  const view = render(tree());
  mockAccount = { account: 'clerk:first', resolved: true };
  view.rerender(tree());
  expect(await screen.findByText('First channel')).toBeInTheDocument();
  getChannels.mockResolvedValue([{ id: '2', name: 'Second channel' }]);
  mockAccount = { account: 'clerk:second', resolved: true };
  view.rerender(tree());
  expect(await screen.findByText('Second channel')).toBeInTheDocument();
  expect(getChannels).toHaveBeenCalledTimes(2);
  view.unmount(); client.clear();
});
