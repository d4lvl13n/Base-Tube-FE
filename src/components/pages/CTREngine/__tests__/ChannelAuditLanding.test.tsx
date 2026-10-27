import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChannelAuditPage from '../ChannelAuditPage';
import useCTREngine from '../../../../hooks/useCTREngine';
import ctrApi from '../../../../api/ctr';
jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../api/ctr', () => ({ __esModule: true, default: { listChannelAudits: jest.fn(), auditChannel: jest.fn(), getChannelAudit: jest.fn() } }));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock('../components/ChannelAuditReport', () => ({ ChannelAuditReport: () => <p>Report</p> }));
const api = ctrApi as jest.Mocked<typeof ctrApi>;
const saved = { id: 42, channelRef: '@garterzelda', channelId: 'UC1', channelTitle: 'Garter', subscribers: 11300, videosAnalyzed: 30, niche: 'Zelda', schemaVersion: 2 as const, mode: 'preview', dataMode: 'preview' as const, createdAt: '2026-10-27T10:00:00Z' };

beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (useCTREngine as jest.Mock).mockImplementation(() => ({ usageAccess: null, isLoadingQuota: false, refreshQuota: jest.fn(), isAnonymous: false }));
  api.listChannelAudits.mockResolvedValue([saved]);
  api.getChannelAudit.mockResolvedValue({ version: 2, id: 42 } as any);
});

it('opens on the empty form, without reopening or listing past audits', async () => {
  render(<MemoryRouter initialEntries={['/ai-thumbnails/channel-audit']}><ChannelAuditPage /></MemoryRouter>);
  expect(await screen.findByPlaceholderText(/yourchannel/)).toHaveValue('');
  expect(api.getChannelAudit).not.toHaveBeenCalled();
  expect(screen.queryByText('Report')).not.toBeInTheDocument();
  expect(screen.queryByText(/previous audits/i)).not.toBeInTheDocument();
});

it('opens the audit History links to', async () => {
  render(<MemoryRouter initialEntries={['/ai-thumbnails/channel-audit?audit=42']}><ChannelAuditPage /></MemoryRouter>);
  expect(await screen.findByText('Report')).toBeInTheDocument();
  expect(api.getChannelAudit).toHaveBeenCalledWith(42);
});
