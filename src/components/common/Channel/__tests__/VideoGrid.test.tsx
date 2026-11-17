import React from 'react';
import { act, render, screen } from '@testing-library/react';
import VideoGrid from '../VideoGrid';
jest.mock('../../VideoCard', () => ({ __esModule: true, default: ({ video }: any) => <div>{video.title}</div> }));
jest.mock('../../PlaceHolderVideoCard', () => ({ __esModule: true, default: () => <div>Loading card</div> }));
let callbacks: IntersectionObserverCallback[];
const disconnect = jest.fn();
const original = window.IntersectionObserver;
beforeEach(() => {
  callbacks = [];
  disconnect.mockClear();
  window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    callbacks.push(callback);
    return { observe: jest.fn(), disconnect, unobserve: jest.fn() };
  }) as any;
});
afterAll(() => { window.IntersectionObserver = original; });
const videos = [{ id: 1, title: 'First' }] as any;
const enter = () => act(() => callbacks[callbacks.length - 1]([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
it('loads the next page on scroll proximity without a Load More button or duplicate requests', () => {
  const next = jest.fn();
  render(<VideoGrid videos={videos} hasMore loadMore={next} />);
  expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  expect(next).not.toHaveBeenCalled();
  enter(); enter();
  expect(next).toHaveBeenCalledTimes(1);
});
it('pauses while loading, continues with appended videos and stops at the last page', () => {
  const next = jest.fn();
  const { rerender, unmount } = render(<VideoGrid videos={videos} hasMore loadMore={next} />);
  enter();
  rerender(<VideoGrid videos={videos} hasMore loading loadMore={next} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading videos');
  expect(callbacks).toHaveLength(1);
  rerender(<VideoGrid videos={[...videos, { id: 2, title: 'Second' }] as any} hasMore loadMore={next} />);
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('Second')).toBeInTheDocument();
  enter();
  expect(next).toHaveBeenCalledTimes(2);
  rerender(<VideoGrid videos={videos} hasMore={false} loadMore={next} />);
  expect(callbacks).toHaveLength(2);
  unmount();
  expect(disconnect).toHaveBeenCalled();
});
