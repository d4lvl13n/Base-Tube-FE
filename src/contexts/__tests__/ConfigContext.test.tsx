import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import api from '../../api';
import { ConfigProvider, useConfig } from '../ConfigContext';
import { DEFAULT_VIEW_CONFIG } from '../../types/config';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const get = api.get as jest.MockedFunction<typeof api.get>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider>{children}</ConfigProvider>
);

const serverConfig = {
  thresholds: { percentage: 42, seconds: 12 },
  limits: { maxViewsPerDay: 3, maxOwnerViews: 1, maxConcurrentViews: 2 },
  updateInterval: 5000,
};

beforeEach(() => {
  jest.useFakeTimers();
  get.mockReset();
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  (console.error as jest.Mock).mockRestore?.();
});

describe('ConfigContext', () => {
  it('serves the server config when the fetch succeeds', async () => {
    get.mockResolvedValue({ data: { success: true, data: serverConfig } } as any);

    const { result } = renderHook(() => useConfig(), { wrapper });

    await waitFor(() => expect(result.current.isFallback).toBe(false));
    expect(result.current.viewConfig).toEqual(serverConfig);
    expect(result.current.error).toBeNull();
  });

  it('falls back to the documented defaults instead of blacking out tracking', async () => {
    get.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useConfig(), { wrapper });

    // The whole point: never null. A null config meant "do not track".
    await waitFor(() => expect(result.current.error).toBe('Failed to load configuration'));
    expect(result.current.viewConfig).toEqual(DEFAULT_VIEW_CONFIG);
    expect(result.current.viewConfig.thresholds.percentage).toBe(30);
    expect(result.current.viewConfig.thresholds.seconds).toBe(30);
    expect(result.current.viewConfig.updateInterval).toBe(30000);
    expect(result.current.isFallback).toBe(true);
  });

  it('treats a malformed payload as a failure rather than trusting it', async () => {
    get.mockResolvedValue({ data: { success: true, data: { nope: true } } } as any);

    const { result } = renderHook(() => useConfig(), { wrapper });

    await waitFor(() => expect(result.current.isFallback).toBe(true));
    expect(result.current.viewConfig).toEqual(DEFAULT_VIEW_CONFIG);
  });

  it('retries with backoff and recovers', async () => {
    get.mockRejectedValueOnce(new Error('down'));
    get.mockResolvedValueOnce({ data: { success: true, data: serverConfig } } as any);

    const { result } = renderHook(() => useConfig(), { wrapper });

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(result.current.viewConfig).toEqual(DEFAULT_VIEW_CONFIG);

    // Nothing before the first backoff window elapses.
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    await waitFor(() => expect(result.current.isFallback).toBe(false));
    expect(result.current.viewConfig).toEqual(serverConfig);
  });

  it('stops retrying once unmounted', async () => {
    get.mockRejectedValue(new Error('down'));

    const { unmount } = renderHook(() => useConfig(), { wrapper });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    unmount();
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('serves a fresh cached config immediately, without waiting on the network', async () => {
    localStorage.setItem(
      'view_config_cache',
      JSON.stringify({ data: serverConfig, timestamp: Date.now() })
    );
    get.mockResolvedValue({ data: { success: true, data: serverConfig } } as any);

    const { result } = renderHook(() => useConfig(), { wrapper });

    expect(result.current.viewConfig).toEqual(serverConfig);
    expect(result.current.isFallback).toBe(false);
  });
});
