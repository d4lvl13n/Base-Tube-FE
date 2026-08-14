import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ChannelAuditRefreshAction from '../ChannelAuditRefreshAction';

describe('ChannelAuditRefreshAction', () => {
  it('explains that a fresh audit creates a new historical report', () => {
    render(<ChannelAuditRefreshAction onRun={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Run fresh audit' })).toBeEnabled();
    expect(
      screen.getByText('Creates a new report. This one stays in history.')
    ).toBeInTheDocument();
  });

  it('starts one fresh audit from the report action', () => {
    const onRun = jest.fn();
    render(<ChannelAuditRefreshAction onRun={onRun} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run fresh audit' }));

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('shows a disabled progress state while the fresh audit is running', () => {
    const onRun = jest.fn();
    render(<ChannelAuditRefreshAction onRun={onRun} isRunning />);

    const button = screen.getByRole('button', { name: 'Running fresh audit…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('renders nothing when the current report has no safe channel reference', () => {
    const { container } = render(<ChannelAuditRefreshAction />);
    expect(container).toBeEmptyDOMElement();
  });
});
