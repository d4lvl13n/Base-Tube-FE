import React from 'react';
import { thumbnailPackagingApi } from '../../../../../api/thumbnailPackaging';
jest.mock('../../../../../api/thumbnailPackaging', () => ({ thumbnailPackagingApi: { save: jest.fn().mockResolvedValue({ id: 8, name: 'Music' }) } }));
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { GeneratedConceptsGrid } from '../GeneratedConceptsGrid';
import { ctrApi } from '../../../../../api/ctr';
import { thumbnailApi } from '../../../../../api/thumbnail';
jest.mock('../../../../../api/ctr', () => ({ ctrApi: { getQuota: jest.fn(), auditThumbnail: jest.fn(), applyOverlay: jest.fn() } }));
jest.mock('../../../../../api/thumbnail', () => ({ thumbnailApi: { refineThumbnailConversationally: jest.fn() } }));
it('compares the edited images through persona audit instead of displaying a fabricated generation score', async () => {
  (thumbnailPackagingApi.save as jest.Mock).mockResolvedValue({ id: 8, name: 'Music' });
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (ctrApi.getQuota as jest.Mock).mockResolvedValue({ mode: 'credits', creditInfo: { available: 20, balance: 20, reserved: 0 }, pricing: { ctr: { auditWithPersonas: 3 } } });
  (ctrApi.auditThumbnail as jest.Mock).mockResolvedValue({ audit: { overallScore: 8, confidence: 'medium', strengths: [], weaknesses: [], suggestions: [] } });
  (thumbnailApi.refineThumbnailConversationally as jest.Mock).mockResolvedValue({ data: { thumbnailUrl: 'https://gateway.storjshare.io/basetube-thumbnails/ed17ed.png?X-Amz-Signature=edited' } });
  const concepts = ['Subject spotlight', 'In context'].map((name, i) => ({ id: String(i), thumbnailUrl: `https://gateway.storjshare.io/basetube-thumbnails/${i}.png?X-Amz-Signature=original`, thumbnailPath: '', prompt: 'Camera', conceptName: name, conceptDescription: 'Camera concept', estimatedCTRScore: 7 }));
  render(<GeneratedConceptsGrid concepts={concepts} detectedNiche="tech" generationTime={1} onClear={jest.fn()} auditContext={{ title: 'Camera review' }} />);
  expect(ctrApi.auditThumbnail).not.toHaveBeenCalled();
  for (const image of screen.getAllByAltText('Subject spotlight')) {
    expect(image).toHaveAttribute('src', '/thumbnail-media/0.png?X-Amz-Signature=original');
  }
  expect(screen.queryByText('7.0')).not.toBeInTheDocument();
  fireEvent.change(screen.getAllByLabelText('Edit instruction')[0], { target: { value: 'Blue background' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Apply edit' })[0]);
  const comparison = screen.getByRole('region', { name: 'Concept comparison' });
  await waitFor(() => expect(within(comparison).getByAltText('Subject spotlight')).toHaveAttribute('src', '/thumbnail-media/ed17ed.png?X-Amz-Signature=edited'));
  fireEvent.click(screen.getAllByRole('button', { name: 'Save style', exact: true })[0]);
  fireEvent.change(screen.getByLabelText('Channel or style name'), { target: { value: 'Music' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save channel style' }));
  await screen.findByText(/Saved as/);
  expect(thumbnailPackagingApi.save).toHaveBeenCalledWith('https://gateway.storjshare.io/basetube-thumbnails/ed17ed.png?X-Amz-Signature=edited', 'Music');
  fireEvent.click(screen.getByRole('button', { name: 'Compare 2 concepts' }));
  await screen.findByRole('button', { name: 'Comparison complete' });
  expect((ctrApi.auditThumbnail as jest.Mock).mock.calls[0][0]).toEqual({ imageUrl: 'https://gateway.storjshare.io/basetube-thumbnails/ed17ed.png?X-Amz-Signature=edited', includePersonas: true, context: { title: 'Camera review', niche: 'tech' } });
});
