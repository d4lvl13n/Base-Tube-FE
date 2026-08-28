import { act, renderHook, waitFor } from '@testing-library/react';
import { searchApi } from '../../api/search';
import { useSearchSuggest, SUGGEST_DEBOUNCE_MS } from '../useSearchSuggest';

jest.mock('../../api/search', () => ({
  searchApi: { suggest: jest.fn() },
}));

const suggest = searchApi.suggest as jest.MockedFunction<typeof searchApi.suggest>;

const reply = (titles: string[] = [], channels: { id: number; name: string; handle: string }[] = []) =>
  Promise.resolve({ success: true, data: { titles, channels } });

describe('useSearchSuggest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    suggest.mockReset();
    suggest.mockImplementation(() => reply());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for nothing below the two-character floor', () => {
    const { rerender } = renderHook(({ input }) => useSearchSuggest(input), {
      initialProps: { input: 'm' },
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(suggest).not.toHaveBeenCalled();

    rerender({ input: '' });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(suggest).not.toHaveBeenCalled();
  });

  it('waits for the debounce before asking', () => {
    renderHook(() => useSearchSuggest('mar'));

    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS - 1);
    });
    expect(suggest).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledWith('mar', expect.anything());
  });

  it('collapses a burst of keystrokes into one request for the last one', () => {
    const { rerender } = renderHook(({ input }) => useSearchSuggest(input), {
      initialProps: { input: 'ma' },
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ input: 'mar' });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ input: 'marr' });
    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS);
    });

    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledWith('marr', expect.anything());
  });

  it('aborts a request that is still in flight when the input changes', () => {
    const { rerender } = renderHook(({ input }) => useSearchSuggest(input), {
      initialProps: { input: 'mar' },
    });

    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS);
    });
    const firstSignal = suggest.mock.calls[0][1]?.signal as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    rerender({ input: 'marr' });
    expect(firstSignal.aborted).toBe(true);

    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS);
    });
    expect(suggest).toHaveBeenCalledTimes(2);
  });

  it('caps the list at five titles and three channels', async () => {
    suggest.mockImplementation(() =>
      reply(
        ['t1', 't2', 't3', 't4', 't5', 't6', 't7'],
        [1, 2, 3, 4, 5].map((id) => ({ id, name: `c${id}`, handle: `c${id}.base` }))
      )
    );

    const { result } = renderHook(() => useSearchSuggest('mar'));
    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS);
    });

    await waitFor(() => expect(result.current.suggestions.titles).toHaveLength(5));
    expect(result.current.suggestions.channels).toHaveLength(3);
  });

  it('does not apply a response that arrived for an abandoned query', async () => {
    suggest.mockImplementationOnce(() => reply(['stale']));
    const { result, rerender } = renderHook(({ input }) => useSearchSuggest(input), {
      initialProps: { input: 'mar' },
    });

    act(() => {
      jest.advanceTimersByTime(SUGGEST_DEBOUNCE_MS);
    });
    rerender({ input: 'marr' });

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.suggestions.titles).toEqual([]);
  });
});
