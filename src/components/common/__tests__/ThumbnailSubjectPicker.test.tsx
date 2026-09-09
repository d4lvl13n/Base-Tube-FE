import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThumbnailSubjectPicker } from '../ThumbnailSubjectPicker';
const photo = new File(['photo'], 'subject.jpg', { type: 'image/jpeg' });
function Picker() {
  const [value, setValue] = useState<File | null>(null);
  return <ThumbnailSubjectPicker value={value} onChange={setValue} />;
}
beforeEach(() => {
  jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => 'blob:test');
  URL.revokeObjectURL = jest.fn();
});
it('accepts a subject photo and rejects invalid input without replacing it', () => {
  render(<Picker />);
  fireEvent.change(screen.getByLabelText('Subject photo'), { target: { files: [photo] } });
  expect(screen.getByAltText('Selected subject reference')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Subject photo'), { target: { files: [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })] } });
  expect(screen.getByRole('alert')).toHaveTextContent('JPEG, PNG or WebP');
  expect(screen.getByText(/Selected subject · subject.jpg/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove reference' }));
  expect(screen.queryByAltText('Selected subject reference')).not.toBeInTheDocument();
});
it('offers only an intentional photo reference and never a video/frame selector', () => {
  const view = render(<Picker />);
  expect(screen.queryByLabelText('Video for subject frames')).not.toBeInTheDocument();
  expect(view.container.querySelector('input[accept="video/*"]')).toBeNull();
  expect(screen.getByLabelText('Subject photo')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
});
