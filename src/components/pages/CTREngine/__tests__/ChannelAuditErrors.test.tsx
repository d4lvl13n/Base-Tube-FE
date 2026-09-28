import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChannelAuditPage from '../ChannelAuditPage';
import useCTREngine from '../../../../hooks/useCTREngine';
import ctrApi from '../../../../api/ctr';
jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../api/ctr', () => ({ __esModule: true, default: { listChannelAudits: jest.fn(), auditChannel: jest.fn(), getChannelAudit: jest.fn() } }));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock('../components/ChannelAuditReport', () => ({ ChannelAuditReport: () => <p>Report</p> }));
const api = ctrApi as jest.Mocked<typeof ctrApi>;
const INCOMPLETE = 'The audit analysis did not finish. Please try again; no incomplete report was saved.';
const failure = (status: number, data: unknown = {}) => ({ isAxiosError: true, message: `Request failed with status code ${status}`, response: { status, data } });
const env = process.env.NODE_ENV;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (useCTREngine as jest.Mock).mockImplementation(() => ({ usageAccess: null, isLoadingQuota: false, refreshQuota: jest.fn(), isAnonymous: false }));
  api.listChannelAudits.mockResolvedValue([]);
});
afterEach(() => {
  (process.env as any).NODE_ENV = env;
});
const audit = async (channel = '@mychannel') => {
  render(<MemoryRouter initialEntries={['/ai-thumbnails/channel-audit']}><ChannelAuditPage /></MemoryRouter>);
  fireEvent.change(await screen.findByPlaceholderText(/yourchannel/), { target: { value: channel } });
  fireEvent.click(screen.getByRole('button', { name: /Audit channel/ }));
};

it('says the audit did not finish in the server\'s words and runs the same channel again on Try again', async () => {
  api.auditChannel.mockRejectedValueOnce(failure(503, { success: false, error: { code: 'PROVIDER_UNAVAILABLE', message: INCOMPLETE } }));
  await audit();
  expect(await screen.findByRole('alert')).toHaveTextContent(INCOMPLETE);
  expect(screen.queryByText(/status code/)).not.toBeInTheDocument();
  expect(screen.queryByText(/HTTP 503/)).not.toBeInTheDocument();
  api.auditChannel.mockResolvedValueOnce({ version: 2 } as any);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(api.auditChannel).toHaveBeenLastCalledWith('@mychannel'));
  expect(await screen.findByText('Report')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('uses a plain sentence when the server sends no message, and shows the status only in development', async () => {
  (process.env as any).NODE_ENV = 'development';
  api.auditChannel.mockRejectedValueOnce(failure(503));
  await audit();
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('The audit did not finish, and no incomplete report was saved. Please try again.');
  expect(alert).toHaveTextContent('(HTTP 503)');
  expect(alert).not.toHaveTextContent('Request failed');
});

it('does not offer Try again when the channel itself is the problem', async () => {
  const notFound = "We couldn't find that channel. Paste the full channel URL (youtube.com/channel/UC…) or an @handle.";
  api.auditChannel.mockRejectedValueOnce(failure(404, { success: false, error: { code: 'NOT_FOUND', message: notFound } }));
  await audit('@nobody');
  expect(await screen.findByRole('alert')).toHaveTextContent(notFound);
  expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
});
