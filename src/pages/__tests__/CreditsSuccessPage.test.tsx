import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreditsSuccessPage from '../CreditsSuccessPage';
import { creditsApi } from '../../api/credits';

jest.mock('../../api/credits', () => ({ creditsApi: { getCreditBalance: jest.fn(), getCreditLedger: jest.fn() } }));
const balance = creditsApi.getCreditBalance as jest.Mock;
const ledger = creditsApi.getCreditLedger as jest.Mock;
const entry = (sessionId: string) => ({ type: 'purchase', balanceDelta: 50, metadata: { sessionId } });
const show = () => render(<MemoryRouter initialEntries={['/credits/success?session_id=cs_test_qa&return=%2Fai-thumbnails%2Fgenerate']}><CreditsSuccessPage /></MemoryRouter>);
const settle = () => act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  balance.mockReset();
  ledger.mockReset();
  // CRA resets the global setup mock's implementation before each test.
  (window.matchMedia as jest.Mock).mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  }));
  sessionStorage.clear();
  balance.mockResolvedValue({ creditInfo: { balance: 1051, available: 1051, reserved: 0 } });
});
afterEach(() => jest.useRealTimers());

it('confirms an already-credited checkout on the first read, including after refresh', async () => {
  ledger.mockResolvedValue([entry('cs_test_qa')]);
  const view = show();
  await settle();
  expect(screen.getByText('Your credits have been added to your balance.')).toBeInTheDocument();
  expect(screen.getByText('1,051')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to the studio' })).toHaveAttribute('href', '/ai-thumbnails/generate');
  view.unmount();
  show();
  await settle();
  expect(screen.getByText('Your credits have been added to your balance.')).toBeInTheDocument();
});

it('does not infer success from unrelated purchases or a balance increase', async () => {
  ledger.mockResolvedValue([entry('cs_other')]);
  balance.mockResolvedValueOnce({ creditInfo: { balance: 1001, available: 1001 } });
  show();
  await settle();
  await act(async () => { jest.advanceTimersByTime(2500); });
  await settle();
  expect(screen.queryByText('Your credits have been added to your balance.')).not.toBeInTheDocument();
  ledger.mockResolvedValue([entry('cs_test_qa')]);
  await act(async () => { jest.advanceTimersByTime(2500); });
  await settle();
  expect(screen.getByText('Your credits have been added to your balance.')).toBeInTheDocument();
});

it('does not confirm a refund or failed ledger read', async () => {
  ledger.mockResolvedValue([{ ...entry('cs_test_qa'), type: 'refund', balanceDelta: -50 }]);
  const view = show();
  await settle();
  expect(screen.queryByText('Your credits have been added to your balance.')).not.toBeInTheDocument();
  view.unmount();
  ledger.mockRejectedValue(new Error('unavailable'));
  show();
  await settle();
  expect(screen.getByRole('heading', { name: "Couldn't confirm your top-up" })).toBeInTheDocument();
});
