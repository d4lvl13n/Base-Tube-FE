import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThumbnailConceptComparison } from '../ThumbnailConceptComparison';
import { ctrApi } from '../../../api/ctr';

jest.mock('../../../api/ctr', () => ({ ctrApi: { getQuota: jest.fn(), auditThumbnail: jest.fn() } }));
const quota = ctrApi.getQuota as jest.Mock;
const audit = ctrApi.auditThumbnail as jest.Mock;
const concepts = [
  { id: 'a', imageUrl: 'https://example.com/a.png', name: 'Subject spotlight' },
  { id: 'b', imageUrl: 'https://example.com/b.png', name: 'In context' },
];
const context = { title: 'My camera', niche: 'tech' };
const access = { mode: 'credits', creditInfo: { available: 20, balance: 20, reserved: 0 }, pricing: { ctr: { auditWithPersonas: 3 } } };
const assessment = { overallScore: 8, confidence: 'medium', strengths: ['Clear subject'], weaknesses: ['Small text'], suggestions: ['Enlarge headline'], personaVotes: { votes: [{ personaName: 'Mobile Scroller', wouldClick: true, reasoning: 'Recognizable camera' }] } };
beforeEach(() => {
  jest.clearAllMocks();
  quota.mockResolvedValue(access);
  audit.mockResolvedValue({ audit: assessment });
});
it('requires an explicit click, shows the cost, and audits each real image with personas and identical context', async () => {
  render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  const button = await screen.findByRole('button', { name: 'Compare 2 concepts' });
  expect(screen.getByText(/Up to 6 credits/)).toBeInTheDocument();
  expect(audit).not.toHaveBeenCalled();
  fireEvent.click(button);
  await screen.findByRole('button', { name: 'Comparison complete' });
  expect(audit.mock.calls).toEqual(concepts.map(concept => [{ imageUrl: concept.imageUrl, includePersonas: true, context }]));
  expect(screen.getAllByText(/AI assessment: 8.0\/10/)).toHaveLength(2);
  expect(screen.getAllByText(/Clear subject/)).toHaveLength(2);
  expect(screen.getAllByText(/Mobile Scroller: would click/)).toHaveLength(2);
});
it('does not submit when the allowance is insufficient', async () => {
  quota.mockResolvedValue({ ...access, creditInfo: { available: 2 } });
  render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  const button = await screen.findByRole('button', { name: 'Compare 2 concepts' });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(audit).not.toHaveBeenCalled();
});
it('preserves successful assessments and retries only the failed image', async () => {
  audit.mockResolvedValueOnce({ audit: assessment }).mockRejectedValueOnce(new Error('Temporary failure'));
  render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Compare 2 concepts' }));
  const retry = await screen.findByRole('button', { name: 'Compare 1 concept' });
  expect(screen.getByText(/Temporary failure/)).toBeInTheDocument();
  expect(screen.getByText(/Up to 3 credits/)).toBeInTheDocument();
  fireEvent.click(retry);
  await screen.findByRole('button', { name: 'Comparison complete' });
  expect(audit).toHaveBeenCalledTimes(3);
  expect(audit.mock.calls[2][0].imageUrl).toBe(concepts[1].imageUrl);
});
it('invalidates only an edited image without automatically paying for another audit', async () => {
  const view = render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Compare 2 concepts' }));
  await screen.findByRole('button', { name: 'Comparison complete' });
  view.rerender(<ThumbnailConceptComparison concepts={[{ ...concepts[0], imageUrl: 'https://example.com/edited.png' }, concepts[1]]} context={context} />);
  expect(screen.getAllByText(/AI assessment: 8.0\/10/)).toHaveLength(1);
  expect(audit).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Compare 1 concept' }));
  await screen.findByRole('button', { name: 'Comparison complete' });
  expect(audit.mock.calls[2][0].imageUrl).toBe('https://example.com/edited.png');
});
it('prevents duplicate clicks and stops queued audits when the images change', async () => {
  let finish!: (value: any) => void;
  audit.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Compare 2 concepts' }));
  fireEvent.click(screen.getByRole('button', { name: 'Comparing…' }));
  expect(audit).toHaveBeenCalledTimes(1);
  view.rerender(<ThumbnailConceptComparison concepts={[{ ...concepts[0], imageUrl: 'https://example.com/edited.png' }, concepts[1]]} context={context} />);
  await act(async () => finish({ audit: assessment }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Compare 2 concepts' })).not.toBeDisabled());
  expect(audit).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/AI assessment: 8.0\/10/)).not.toBeInTheDocument();
});
it('stops after a credit rejection instead of charging more queued assessments', async () => {
  audit.mockRejectedValueOnce({ response: { status: 402, data: { error: { message: 'Not enough credits' } } } });
  render(<ThumbnailConceptComparison concepts={concepts} context={context} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Compare 2 concepts' }));
  await screen.findByRole('alert');
  expect(audit).toHaveBeenCalledTimes(1);
});
