import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveThumbnailStyle, ThumbnailStylePicker } from '../ThumbnailPackaging';
import { thumbnailPackagingApi } from '../../../api/thumbnailPackaging';
jest.mock('../../../api/thumbnailPackaging', () => ({ thumbnailPackagingApi: { save: jest.fn(), list: jest.fn(), remove: jest.fn() } }));
const imageUrl = 'https://gateway.storjshare.io/basetube-thumbnails/abc-123.webp?signature=unchanged';
beforeEach(() => jest.clearAllMocks());
it('saves the displayed image and chosen channel name, with failure and retry', async () => {
  (thumbnailPackagingApi.save as jest.Mock).mockRejectedValueOnce(new Error('Please retry')).mockResolvedValue({ id: 7, name: 'Music', imageUrl });
  render(<SaveThumbnailStyle imageUrl={imageUrl} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save style', exact: true }));
  expect(screen.getByRole('button', { name: 'Save channel style' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Channel or style name'), { target: { value: 'Music' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save channel style' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please retry');
  fireEvent.click(screen.getByRole('button', { name: 'Save channel style' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Saved as “Music”');
  expect(thumbnailPackagingApi.save).toHaveBeenLastCalledWith(imageUrl, 'Music');
});
it('loads saved styles on return, uses a proxied preview and removes only the style', async () => {
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValue([{ id: 7, name: 'Music', imageUrl }]);
  (thumbnailPackagingApi.remove as jest.Mock).mockResolvedValue(undefined);
  const onChange = jest.fn();
  render(<ThumbnailStylePicker value={7} onChange={onChange} />);
  expect(await screen.findByRole('img', { name: 'Music' })).toHaveAttribute('src', '/thumbnail-media/abc-123.webp?signature=unchanged');
  expect(screen.getByRole('combobox', { name: 'Channel style' })).toHaveValue('7');
  fireEvent.click(screen.getByRole('button', { name: 'Remove saved style' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined));
  expect(thumbnailPackagingApi.remove).toHaveBeenCalledWith(7);
});
it('does not silently switch to a different style when loading fails', async () => {
  (thumbnailPackagingApi.list as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ id: 7, name: 'Music', imageUrl }]);
  const onChange = jest.fn();
  render(<ThumbnailStylePicker value={7} onChange={onChange} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('img', { name: 'Music' })).toBeInTheDocument();
});
it('tells the logo picker whether the selected style includes an original logo', async () => {
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValue([{ id: 7, name: 'Music', imageUrl, hasLogo: true }]);
  const onChange = jest.fn();
  render(<ThumbnailStylePicker onChange={onChange} />);
  await screen.findByRole('option', { name: 'Music' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Channel style' }), { target: { value: '7' } });
  expect(onChange).toHaveBeenLastCalledWith(7, true);
  fireEvent.change(screen.getByRole('combobox', { name: 'Channel style' }), { target: { value: '' } });
  expect(onChange).toHaveBeenLastCalledWith(undefined, undefined);
});

it('adds a second style without hiding save or replacing the selected style', async () => {
  const first = { id: 7, name: 'Music', imageUrl };
  const nextUrl = 'https://gateway.storjshare.io/basetube-thumbnails/def-456.png';
  const second = { id: 8, name: 'Travel', imageUrl: nextUrl };
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValueOnce([first]).mockResolvedValue([first, second]);
  (thumbnailPackagingApi.save as jest.Mock).mockResolvedValue(second);
  const onChange = jest.fn();
  render(<><ThumbnailStylePicker value={7} onChange={onChange} /><SaveThumbnailStyle imageUrl={nextUrl} /></>);
  await screen.findByRole('option', { name: 'Music' });
  expect(screen.getByText(/To add another style/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save style', exact: true }));
  fireEvent.change(screen.getByLabelText('Channel or style name'), { target: { value: 'Travel' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save channel style' }));
  await screen.findByRole('option', { name: 'Travel' });
  expect(screen.getByRole('option', { name: 'Music' })).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('7');
  expect(screen.getByRole('button', { name: 'Rename style', exact: true })).toBeEnabled();
  expect(onChange).not.toHaveBeenCalled();
  expect(thumbnailPackagingApi.save).toHaveBeenCalledWith(nextUrl, 'Travel');
});

it('offers visual style choices and start fresh without deleting saved styles', async () => {
  (thumbnailPackagingApi.list as jest.Mock).mockResolvedValue([{ id: 7, name: 'Music', imageUrl, hasLogo: true }]);
  const onChange = jest.fn();
  render(<ThumbnailStylePicker visual value={7} onChange={onChange} />);
  const tile = await screen.findByRole('button', { name: 'Music', exact: true });
  expect(tile).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Logo included')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Start fresh/ }));
  expect(onChange).toHaveBeenLastCalledWith(undefined, undefined);
  expect(thumbnailPackagingApi.remove).not.toHaveBeenCalled();
});
