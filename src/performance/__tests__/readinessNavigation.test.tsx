import React, { StrictMode, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { PerformanceRouteObserver } from '../PerformanceRouteObserver';
import { useContentReady } from '../useContentReady';

function Content() {
  const [ready, setReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useContentReady(location.pathname === '/' ? 'home_content_ready' : 'channel_content_ready', ready);
  return <><button onClick={() => setReady(true)}>Ready</button><button onClick={() => navigate('/channel/example')}>Next</button></>;
}

test('the committed route starts its clock before ready effects and StrictMode does not duplicate them', () => {
  let now = 1200;
  const clock = jest.spyOn(performance, 'now').mockImplementation(() => now);
  const measure = jest.fn();
  Object.defineProperty(performance, 'measure', { configurable: true, value: measure });
  render(<StrictMode><MemoryRouter><PerformanceRouteObserver /><Content /></MemoryRouter></StrictMode>);
  expect(measure).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Ready'));
  expect(measure).toHaveBeenCalledTimes(1);
  expect(measure).toHaveBeenLastCalledWith('basetube:home_content_ready', { start: 0, duration: 1200 });
  now = 5000;
  fireEvent.click(screen.getByText('Next'));
  expect(measure).toHaveBeenCalledTimes(2);
  expect(measure).toHaveBeenLastCalledWith('basetube:channel_content_ready', { start: 5000, duration: 0 });
  clock.mockRestore();
});
