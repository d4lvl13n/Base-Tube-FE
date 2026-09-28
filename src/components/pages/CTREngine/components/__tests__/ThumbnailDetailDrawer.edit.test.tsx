import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThumbnailDetailDrawer } from '../ThumbnailDetailDrawer';
import { downloadGalleryThumbnail } from '../../../../../hooks/useThumbnailGallery';
import { thumbnailApi } from '../../../../../api/thumbnail';
import { StudioRequestError } from '../../../../../api/studioErrors';
jest.mock('../../../../../hooks/useThumbnailGallery', () => ({ downloadGalleryThumbnail: jest.fn() }));
jest.mock('../../../../../hooks/useStudioAccount', () => ({ useStudioAccount: () => 'clerk:gallery-owner' }));
jest.mock('../../../../../api/thumbnail', () => ({ thumbnailApi: { refineThumbnailConversationally: jest.fn() } }));
jest.mock('../studio/OpenThumbnailProject', () => ({ OpenThumbnailProject: () => <p>Open in a project</p> }));
jest.mock('../ViralSharePopup', () => ({ ViralSharePopup: () => null }));
it('edits a gallery thumbnail only through a project, never the quota refine', async () => {
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (downloadGalleryThumbnail as jest.Mock).mockResolvedValue(undefined);
  const thumbnail = { id: 123, prompt: 'Camera', imageUrl: 'https://example.com/original.png', createdAt: '2026-09-09', size: 'short' as const };
  render(<ThumbnailDetailDrawer thumbnail={thumbnail} isOpen onClose={jest.fn()} />);
  expect(screen.getByText('Open in a project')).toBeInTheDocument();
  expect(screen.queryByLabelText('Edit instruction')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Apply edit' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Download image' }));
  await waitFor(() => expect(downloadGalleryThumbnail).toHaveBeenCalledWith(123));
  expect(screen.queryByText(/Enter email to download/)).not.toBeInTheDocument();
  expect(thumbnailApi.refineThumbnailConversationally).not.toHaveBeenCalled();
});

describe('controlled Studio drawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
    (downloadGalleryThumbnail as jest.Mock).mockRejectedValue(new Error('Studio must not use the gallery download'));
  });
  const thumbnail = { id: 'server-version-1', imageUrl: '/saved.png', prompt: 'Camera', createdAt: '2026-09-26' };
  it('reuses preview, editor and download while avoiding the gallery download and all legacy editing', async () => {
    const onRequestEdit = jest.fn();
    const onDownload = jest.fn();
    const onSelect = jest.fn();
    const controlled = { editor: { version: thumbnail, onRequestEdit, editCredits: 18 }, onDownload, onSelect, versionInfo: <p>Saved warning details</p>, actions: <button>Audit this version · 2 credits</button> };
    const view = render(<ThumbnailDetailDrawer thumbnail={thumbnail} isOpen onClose={jest.fn()} controlled={controlled} />);
    expect(downloadGalleryThumbnail).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save style' })).not.toBeInTheDocument();
    expect(screen.getByText('Saved warning details')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: 'Blue background' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply edit · 18 credits' }));
    expect(onRequestEdit).toHaveBeenCalledWith(thumbnail, expect.stringContaining('Blue background'), 'custom', 'Blue background');
    expect(thumbnailApi.refineThumbnailConversationally).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep this version' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'server-version-1', imageUrl: '/saved.png' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download · free' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Downloaded' })).toBeEnabled());
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'server-version-1', imageUrl: '/saved.png' }));
    const preview = screen.getByRole('img');
    preview.style.display = 'none'; // an expired URL was hidden by the existing error handler
    const updated = { ...thumbnail, imageUrl: '/renewed.png' };
    view.rerender(<ThumbnailDetailDrawer thumbnail={updated} isOpen onClose={jest.fn()} controlled={{ ...controlled, editor: { version: updated, onRequestEdit }, selected: true }} />);
    fireEvent.load(preview);
    expect(preview).toHaveAttribute('src', '/renewed.png');
    expect(preview.style.display).toBe('');
    expect(screen.getByRole('button', { name: 'Selected version' })).toBeDisabled();
  });
  it('keeps selection and free download available while image edits are paused', async () => {
    const onDownload = jest.fn();
    render(<ThumbnailDetailDrawer thumbnail={thumbnail} isOpen onClose={jest.fn()} controlled={{ editor: { version: thumbnail, onRequestEdit: jest.fn(), pending: true }, onDownload, onSelect: jest.fn(), editingDisabled: true }} />);
    expect(screen.getByRole('button', { name: 'Apply edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep this version' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Download · free' }));
    await waitFor(() => expect(onDownload).toHaveBeenCalledTimes(1));
    expect(downloadGalleryThumbnail).not.toHaveBeenCalled();
  });
  it('reports download errors and retries only the supplied free export callback', async () => {
    const onDownload = jest.fn().mockRejectedValueOnce(new Error('Expired URL')).mockResolvedValue(undefined);
    render(<ThumbnailDetailDrawer thumbnail={thumbnail} isOpen onClose={jest.fn()} controlled={{ editor: { version: thumbnail, onRequestEdit: jest.fn() }, onDownload }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download · free' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not download');
    fireEvent.click(screen.getByRole('button', { name: 'Download · free' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(onDownload).toHaveBeenCalledTimes(2);
    expect(downloadGalleryThumbnail).not.toHaveBeenCalled();
  });
  it('offers the export the server suggests after EXPORT_TOO_LARGE as one click', async () => {
    const onDownload = jest.fn()
      .mockRejectedValueOnce(new StudioRequestError('EXPORT_TOO_LARGE', 'This PNG exceeds 2 MiB. Export the original PNG or choose JPEG.', { suggested: { format: 'png', size: 'original' } }))
      .mockResolvedValue(undefined);
    render(<ThumbnailDetailDrawer thumbnail={thumbnail} isOpen onClose={jest.fn()} controlled={{ editor: { version: thumbnail, onRequestEdit: jest.fn() }, onDownload }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download · free' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This PNG exceeds 2 MiB');
    fireEvent.click(screen.getByRole('button', { name: 'Download as PNG, original size instead' }));
    await waitFor(() => expect(onDownload).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'server-version-1' }), { format: 'png', size: 'original' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
it("moves focus into the drawer and returns it to the element that opened it", async () => {
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  const thumbnail = { id: 'server-version-1', imageUrl: '/saved.png', prompt: 'Camera', createdAt: '2026-09-26' };
  const controlled = { editor: { version: thumbnail, onRequestEdit: jest.fn() }, onDownload: jest.fn() };
  const page = (isOpen: boolean) => <><button type="button">Open preview</button><ThumbnailDetailDrawer thumbnail={thumbnail} isOpen={isOpen} onClose={jest.fn()} controlled={controlled} /></>;
  const view = render(page(false));
  const opener = screen.getByRole('button', { name: 'Open preview' });
  opener.focus();
  view.rerender(page(true));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Close thumbnail details' })).toHaveFocus());
  view.rerender(page(false));
  expect(opener).toHaveFocus();
});
