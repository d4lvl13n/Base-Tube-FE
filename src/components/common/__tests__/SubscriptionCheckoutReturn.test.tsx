import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SubscriptionCheckoutReturn from '../SubscriptionCheckoutReturn';
import { rememberSubscriptionCheckout, subscriptionCheckoutReturn } from '../../../utils/subscriptionCheckoutReturn';

const Where = () => <output data-testid="where">{useLocation().pathname + useLocation().search}</output>;
const app = (path: string) => <MemoryRouter initialEntries={[path]}><SubscriptionCheckoutReturn><Where /></SubscriptionCheckoutReturn></MemoryRouter>;
beforeEach(() => sessionStorage.clear());

it.each(['/ai-thumbnails/auth/continue', '/ai-thumbnails/projects', '/ai-thumbnails/projects/project-1'])(
  'returns from Stripe to pricing rather than %s, preserving the saved idea', async path => {
    const draft = '/ai-thumbnails/generate?draft=saved-idea';
    rememberSubscriptionCheckout(draft);
    render(app(path));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/ai-thumbnails/pricing?checkout=cancelled'));
    const url = new URL(screen.getByTestId('where').textContent!, 'http://localhost');
    expect(url.searchParams.get('return')).toBe(draft);
    expect(subscriptionCheckoutReturn()).toBeNull();
  });

it('handles a page restored by browser Back from the back/forward cache', async () => {
  render(app('/ai-thumbnails/projects/project-1'));
  expect(screen.getByTestId('where').textContent).toBe('/ai-thumbnails/projects/project-1');
  rememberSubscriptionCheckout('/ai-thumbnails/projects/project-1');
  act(() => window.dispatchEvent(new Event('pageshow')));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/ai-thumbnails/pricing?checkout=cancelled'));
});

it('lets successful checkout reach confirmation with its original return path', () => {
  rememberSubscriptionCheckout('/ai-thumbnails/generate?draft=saved-idea');
  const success = '/ai-thumbnails/billing/success?session_id=cs_fixture&return=saved';
  render(app(success));
  expect(screen.getByTestId('where').textContent).toBe(success);
  expect(subscriptionCheckoutReturn()).toBeNull();
});

it('does not redirect normal visits or expired checkout records', () => {
  rememberSubscriptionCheckout('https://outside.example', Date.now() - 25 * 60 * 60 * 1000);
  expect(subscriptionCheckoutReturn()).toBeNull();
  render(app('/ai-thumbnails/projects'));
  expect(screen.getByTestId('where').textContent).toBe('/ai-thumbnails/projects');
});
