import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReferralPanel from '../ReferralPanel';
import { getMyReferral } from '../../../../../api/referral';

jest.mock('../../../../../api/referral', () => ({ getMyReferral: jest.fn() }));
const referral = { referral_code: 'creator', referral_link: 'https://beta.base.tube/sign-up?ref=creator', stats: { pending: 0, rewarded: 0, rejected: 0, total: 0 } };
const writeText = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getMyReferral as jest.Mock).mockResolvedValue(referral);
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
});

it('keeps the sidebar quiet and copies the exact invite link with confirmation', async () => {
  render(<ReferralPanel />);
  const trigger = await screen.findByRole('button', { name: 'Invite a creator' });
  trigger.focus();
  fireEvent.mouseDown(trigger);
  fireEvent.click(trigger);
  expect(await screen.findByRole('dialog', { name: 'Invite a creator' })).toBeInTheDocument();
  expect(screen.queryByText(/0 pending/)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));
  await screen.findByRole('button', { name: 'Link copied' });
  expect(writeText).toHaveBeenCalledWith(referral.referral_link);
  fireEvent.click(screen.getByRole('button', { name: 'Close invite panel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
  // Let the dialog exit transition finish before reopening it.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
  fireEvent.mouseDown(trigger);
  fireEvent.click(trigger);
  expect(await screen.findByRole('button', { name: 'Copy invite link' })).toBeInTheDocument();
});

it('offers a selectable link if clipboard access fails', async () => {
  writeText.mockRejectedValue(new Error('Clipboard denied'));
  render(<ReferralPanel />);
  fireEvent.click(await screen.findByRole('button', { name: 'Invite a creator' }));
  fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t copy automatically');
  expect(screen.getByRole('textbox', { name: 'Invite link' })).toHaveValue(referral.referral_link);
  expect(screen.queryByText('Link copied')).not.toBeInTheDocument();
});

it('shows activity only in the panel and supports Escape with focus returning to the trigger', async () => {
  (getMyReferral as jest.Mock).mockResolvedValue({ ...referral, stats: { pending: 2, rewarded: 3, rejected: 0, total: 5 } });
  render(<ReferralPanel />);
  const trigger = await screen.findByRole('button', { name: 'Invite a creator' });
  expect(screen.queryByText(/2 pending/)).not.toBeInTheDocument();
  trigger.focus();
  fireEvent.mouseDown(trigger);
  fireEvent.click(trigger);
  expect(await screen.findByText('2 pending · 3 qualified')).toBeInTheDocument();
  fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});

it('does not show an unusable invite action when the referral request fails', async () => {
  (getMyReferral as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
  render(<ReferralPanel />);
  await waitFor(() => expect(getMyReferral).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
