import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThumbnailLogoPicker } from '../ThumbnailLogoPicker';
const logo = new File(['logo'], 'AA_TV_LOGO.png', { type: 'image/png' });
let images: Array<any>;
let imageSpy: jest.SpyInstance;
function Picker({ savedLogo = false, disabled = false }: { savedLogo?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState<File | null>(null);
  return <ThumbnailLogoPicker value={value} onChange={setValue} savedLogo={savedLogo} disabled={disabled} onCheckingChange={jest.fn()} />;
}
beforeEach(() => {
  images = [];
  URL.createObjectURL = jest.fn(() => 'blob:logo');
  URL.revokeObjectURL = jest.fn();
  imageSpy = jest.spyOn(window, 'Image').mockImplementation(() => {
    const image = { naturalWidth: 300, naturalHeight: 150, src: '', onload: () => {}, onerror: () => {} };
    images.push(image); return image as unknown as HTMLImageElement;
  });
});
afterEach(() => imageSpy.mockRestore());
const choose = (file = logo) => fireEvent.change(screen.getByLabelText('Channel logo file'), { target: { files: [file] } });
it('shows checking then a preview, filename and ready state, hiding native file-input text', async () => {
  const view = render(<Picker />);
  expect(screen.getByRole('button', { name: 'Choose logo' })).toBeEnabled();
  expect(screen.getByLabelText('Channel logo file')).toHaveClass('hidden');
  choose();
  expect(screen.getByRole('status')).toHaveTextContent('Checking image');
  expect(screen.getByRole('button', { name: 'Choose logo' })).toBeDisabled();
  await act(async () => images[0].onload());
  expect(screen.getByAltText('Selected channel logo')).toHaveAttribute('src', 'blob:logo');
  expect(screen.getByText('AA_TV_LOGO.png')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Ready for your next generation');
  expect(screen.getByRole('button', { name: 'Replace logo' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
  expect(screen.queryByAltText('Selected channel logo')).not.toBeInTheDocument();
  expect(screen.getByText('No logo selected')).toBeInTheDocument();
  view.unmount(); expect(URL.revokeObjectURL).toHaveBeenCalled();
});
it('retains a valid selection when a replacement has an invalid format or cannot decode', async () => {
  render(<Picker />); choose(); await act(async () => images[0].onload());
  choose(new File(['bad'], 'bad.svg', { type: 'image/svg+xml' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Your current logo has not changed');
  expect(screen.getByText('AA_TV_LOGO.png')).toBeInTheDocument();
  choose(new File(['corrupt'], 'bad.png', { type: 'image/png' }));
  await act(async () => images[1].onerror());
  expect(screen.getByRole('alert')).toHaveTextContent('could not be read');
  expect(screen.getByText('AA_TV_LOGO.png')).toBeInTheDocument();
});
it('clearly restores the saved-style logo after removing a local override', async () => {
  render(<Picker savedLogo />);
  expect(screen.getByRole('status')).toHaveTextContent('Included automatically');
  choose(); await act(async () => images[0].onload());
  expect(screen.getByText(/Replaces the saved logo/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Use saved logo instead' }));
  expect(screen.getByText('Logo from your saved style')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Included automatically');
});
it('does not allow changes while generation is running', () => {
  render(<Picker disabled />);
  expect(screen.getByRole('button', { name: 'Choose logo' })).toBeDisabled();
});
