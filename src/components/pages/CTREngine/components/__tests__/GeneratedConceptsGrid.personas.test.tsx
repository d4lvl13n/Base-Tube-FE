import React from 'react';
jest.mock('../ViralSharePopup', () => ({ ViralSharePopup: ({ thumbnail, isOpen }: any) => isOpen ? <output>{thumbnail.shareUrl}</output> : null }));
import { thumbnailPackagingApi } from '../../../../../api/thumbnailPackaging';
jest.mock('../../../../../api/thumbnailPackaging', () => ({ thumbnailPackagingApi: { save: jest.fn().mockResolvedValue({ id: 8, name: 'Music' }) } }));
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { GeneratedConceptsGrid } from '../GeneratedConceptsGrid';
import { ctrApi } from '../../../../../api/ctr';
jest.mock('../../../../../api/ctr', () => ({ ctrApi: { getQuota: jest.fn(), auditThumbnail: jest.fn() } }));
const original = (i: number) => `https://gateway.storjshare.io/basetube-thumbnails/${i}.png?X-Amz-Signature=original`;
it('compares the concepts through persona audit without a fabricated score or a quota AI edit', async () => {
  (thumbnailPackagingApi.save as jest.Mock).mockResolvedValue({ id: 8, name: 'Music' });
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (ctrApi.getQuota as jest.Mock).mockResolvedValue({ mode: 'credits', creditInfo: { available: 20, balance: 20, reserved: 0 }, pricing: { ctr: { auditWithPersonas: 3 } } });
  (ctrApi.auditThumbnail as jest.Mock).mockResolvedValue({ audit: { overallScore: 8, confidence: 'medium', strengths: [], weaknesses: [], suggestions: [] } });
  const concepts = ['Subject spotlight', 'In context'].map((name, i) => ({ id: String(i), shareUrl: 'original-share', thumbnailUrl: original(i), thumbnailPath: '', prompt: 'Camera', conceptName: name, conceptDescription: 'Camera concept', estimatedCTRScore: 7 }));
  render(<GeneratedConceptsGrid concepts={concepts} detectedNiche="tech" generationTime={1} onClear={jest.fn()} auditContext={{ title: 'Camera review' }} />);
  expect(ctrApi.auditThumbnail).not.toHaveBeenCalled();
  for (const image of screen.getAllByAltText('Subject spotlight')) {
    expect(image).toHaveAttribute('src', '/thumbnail-media/0.png?X-Amz-Signature=original');
  }
  expect(screen.queryByText('7.0')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Refine this' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Edit instruction')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Share', exact: true })[0]);
  expect(screen.getByText('original-share')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Help me choose'));
  const comparison = screen.getByRole('region', { name: 'Concept comparison' });
  expect(within(comparison).getByAltText('Subject spotlight')).toHaveAttribute('src', '/thumbnail-media/0.png?X-Amz-Signature=original');
  fireEvent.click(screen.getAllByRole('button', { name: 'Save style', exact: true })[0]);
  fireEvent.change(screen.getByLabelText('Channel or style name'), { target: { value: 'Music' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save channel style' }));
  await screen.findByText(/Saved as/);
  expect(thumbnailPackagingApi.save).toHaveBeenCalledWith(original(0), 'Music');
  fireEvent.click(screen.getByRole('button', { name: 'Compare 2 concepts' }));
  await screen.findByRole('button', { name: 'Comparison complete' });
  expect((ctrApi.auditThumbnail as jest.Mock).mock.calls[0][0]).toEqual({ imageUrl: original(0), includePersonas: true, context: { title: 'Camera review', niche: 'tech' } });
});
it('shows a usable single concept without an empty comparison or an edit offer', async () => {
  const concept = { id: 'one', thumbnailUrl: '/one.png', thumbnailPath: '', prompt: 'Camera', conceptName: 'One concept', conceptDescription: 'Camera close-up', estimatedCTRScore: 7 };
  render(<GeneratedConceptsGrid concepts={[concept]} detectedNiche={null} generationTime={1} onClear={jest.fn()} />);
  expect(screen.queryByText('Help me choose')).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('img', { name: 'One concept' })).toBeVisible());
  expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Refine this' })).not.toBeInTheDocument();
  expect(screen.queryByText(/daily thumbnail allowance/)).not.toBeInTheDocument();
});
