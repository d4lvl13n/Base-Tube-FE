import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GeneratedConceptsGrid, ControlledConceptsGrid } from '../GeneratedConceptsGrid';
import { thumbnailApi } from '../../../../../api/thumbnail';
import { ctrApi } from '../../../../../api/ctr';
import { GeneratedConcept } from '../../../../../types/ctr';
import { StudioRequestError } from '../../../../../api/studioErrors';
jest.mock('../../../../../api/thumbnail', () => ({ thumbnailApi: { refineThumbnailConversationally: jest.fn() } }));
jest.mock('../../../../../api/ctr', () => ({ ctrApi: { getQuota: jest.fn(), auditThumbnail: jest.fn(), applyFinalAdjustments: jest.fn() } }));
jest.mock('../../../../common/ThumbnailPackaging', () => ({ SaveThumbnailStyle: () => <button>Legacy save style</button> }));
jest.mock('../ViralSharePopup', () => ({ ViralSharePopup: () => <p>Legacy sharing</p> }));
const concepts: GeneratedConcept[] = ['v1', 'v2'].map(id => ({ id, thumbnailUrl: `/${id}.png`, thumbnailPath: '', conceptName: `Version ${id}`, conceptDescription: 'Saved image', prompt: id === 'v2' ? 'Make the sky orange' : '', estimatedCTRScore: 0 }));
let controlled: ControlledConceptsGrid;
beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  controlled = { onRefine: jest.fn(), onSelect: jest.fn(), onDownload: jest.fn(), renderVersionInfo: concept => <p>{`Review warning ${concept.id}`}</p>, renderActions: concept => <p>{`Running edit ${concept.id}`}</p> };
});
function grid(value = concepts) { return <GeneratedConceptsGrid concepts={value} detectedNiche={null} generationTime={null} onClear={jest.fn()} controlled={controlled} />; }

it('shows compact Choose cards: Refine, a free download and Keep, with supplied warnings and no legacy side effects', async () => {
  const view = render(grid());
  expect(screen.queryByText('Legacy sharing')).not.toBeInTheDocument();
  expect(screen.queryByText('Legacy save style')).not.toBeInTheDocument();
  expect(screen.queryByText('Help me choose')).not.toBeInTheDocument();
  // The edit tools live on the Refine step, not on the cards.
  expect(screen.queryByLabelText('Edit instruction')).not.toBeInTheDocument();
  expect(ctrApi.getQuota).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByText('Review warning v1')).toBeVisible());
  expect(screen.getByText('Running edit v2')).toBeInTheDocument();
  // What an edited version asked for, in one line.
  expect(screen.getByText('Make the sky orange')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Refine' })[1]);
  expect(controlled.onRefine).toHaveBeenCalledWith(concepts[1]);
  fireEvent.click(screen.getAllByRole('button', { name: 'Keep this version' })[0]);
  expect(controlled.onSelect).toHaveBeenCalledWith(concepts[0]);
  expect(screen.queryByRole('button', { name: 'Selected version' })).not.toBeInTheDocument();
  controlled = { ...controlled, selectedId: 'v1' };
  view.rerender(grid());
  expect(screen.getByRole('button', { name: 'Selected version' })).toBeDisabled();
  fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
  await waitFor(() => expect(controlled.onDownload).toHaveBeenCalledWith(concepts[0]));
  expect(ctrApi.auditThumbnail).not.toHaveBeenCalled();
  expect(thumbnailApi.refineThumbnailConversationally).not.toHaveBeenCalled();
});
it('refreshes images from props and displays only the supplied comparison', () => {
  controlled = { ...controlled, comparison: <p>Saved comparison preview</p> };
  const view = render(grid());
  expect(screen.getByText('Saved comparison preview')).toBeInTheDocument();
  const refreshed = [{ ...concepts[0], thumbnailUrl: '/renewed.png' }, concepts[1]];
  view.rerender(grid(refreshed));
  expect(screen.getByRole('img', { name: 'Version v1' })).toHaveAttribute('src', '/renewed.png');
  expect(ctrApi.getQuota).not.toHaveBeenCalled();
});
it('shows a recoverable download error while retaining the selected server image', async () => {
  controlled.onDownload = jest.fn().mockRejectedValueOnce(new Error('Expired')).mockResolvedValue(undefined);
  render(grid([concepts[0]]));
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not download');
  expect(screen.getByRole('img')).toHaveAttribute('src', '/v1.png');
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(controlled.onDownload).toHaveBeenCalledTimes(2);
});

it('keeps saved selection and export available when the signed preview is unavailable', async () => {
  const withoutPreview = { ...concepts[0], thumbnailUrl: '' };
  render(grid([withoutPreview]));
  await waitFor(() => expect(screen.getByText(/Preview unavailable/)).toBeVisible());
  fireEvent.click(screen.getByRole('button', { name: 'Keep this version' }));
  expect(controlled.onSelect).toHaveBeenCalledWith(withoutPreview);
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  await waitFor(() => expect(controlled.onDownload).toHaveBeenCalledWith(withoutPreview));
});

it('offers the export the server suggests after EXPORT_TOO_LARGE as one click', async () => {
  controlled.onDownload = jest.fn()
    .mockRejectedValueOnce(new StudioRequestError('EXPORT_TOO_LARGE', 'This export exceeds 20 MiB. Choose JPEG or the YouTube size.', { suggested: { format: 'jpeg', size: 'youtube' } }))
    .mockResolvedValue(undefined);
  render(grid([concepts[0]]));
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('This export exceeds 20 MiB');
  fireEvent.click(screen.getByRole('button', { name: 'Download as JPEG, YouTube size instead' }));
  await waitFor(() => expect(controlled.onDownload).toHaveBeenLastCalledWith(concepts[0], { format: 'jpeg', size: 'youtube' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /instead$/ })).not.toBeInTheDocument());
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('offers no alternative when the refusal suggests none', async () => {
  controlled.onDownload = jest.fn().mockRejectedValueOnce(new StudioRequestError('EXPORT_TOO_LARGE', 'Too large.'));
  render(grid([concepts[0]]));
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Too large.');
  expect(screen.queryByRole('button', { name: /instead$/ })).not.toBeInTheDocument();
});
