import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIThumbnailPanel from '../AIThumbnailPanel';

it('generates reference concepts and applies only the selected edit or undo result', async () => {
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  URL.createObjectURL = jest.fn(() => 'blob:reference');
  URL.revokeObjectURL = jest.fn();
  const generated = { data: { thumbnails: [{ thumbnailUrl: 'https://example.com/original.png', conceptName: 'Subject spotlight', conceptDescription: 'Close-up' }] } };
  const generateWithReference = jest.fn().mockResolvedValue(generated);
  const generateForVideo = jest.fn();
  const refineThumbnail = jest.fn().mockResolvedValue({ data: { thumbnailUrl: 'https://example.com/edited.png' } });
  const apply = jest.fn();
  render(<AIThumbnailPanel isOpen onClose={jest.fn()} videoId={12} videoTitle="My camera" videoDescription="Review" onThumbnailGenerated={apply}
    isGeneratingForVideo={false} isGeneratingFromPrompt={false} isGeneratingWithReference={false} isRefiningThumbnail={false}
    generateForVideo={generateForVideo} generateFromPrompt={jest.fn()} generateWithReference={generateWithReference} refineThumbnail={refineThumbnail} />);
  const photo = new File(['image'], 'camera.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Subject photo'), { target: { files: [photo] } });
  fireEvent.change(screen.getByLabelText('Creator hook'), { target: { value: 'Better in my test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate Thumbnails' }));
  await screen.findByRole('button', { name: 'Apply Selected Thumbnail' });
  expect(generateWithReference).toHaveBeenCalledWith(expect.objectContaining({ referenceImage: photo, referenceRole: 'subject', creatorBrief: { title: 'My camera', description: 'Review', creatorHook: 'Better in my test' }, distinctConcepts: true, n: 3 }));
  expect(generateForVideo).not.toHaveBeenCalled();
  expect(apply).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Edit target'), { target: { value: 'background' } });
  fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: 'Make it blue' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled());
  expect(refineThumbnail).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://example.com/original.png', instruction: expect.stringContaining('Preserve subject identity') }));
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply Selected Thumbnail' }));
  expect(apply).toHaveBeenCalledWith('https://example.com/original.png');
});
