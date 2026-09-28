import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThumbnailAuditResult } from '../ThumbnailAuditResult';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import { loadStudioCreateDraft, loadStudioDraft } from '../../../../../utils/studioDraft';
jest.mock('../../../../../api/ctr', () => ({ ctrApi: {}, getScoreColor: () => 'orange', getScoreLabel: () => 'Review' }));
jest.mock('../../../../../hooks/useStudioAccount', () => ({ useStudioAccount: jest.fn() }));
const audit = { overallScore: 6, confidence: 'high', detectedNiche: 'tech', heuristics: {}, strengths: ['Clear subject'], weaknesses: ['Small headline'], suggestions: ['Enlarge headline'] } as any;
const Destination = () => { const location = useLocation(); return <output data-testid="destination">{location.pathname + location.search}</output>; };
const view = () => render(<MemoryRouter initialEntries={['/ai-thumbnails/audit']}><Routes>
  <Route path="/ai-thumbnails/audit" element={<ThumbnailAuditResult audit={audit} youtubeMetadata={{ title: 'My camera review' } as any} onClear={jest.fn()} />} />
  <Route path="/ai-thumbnails/generate" element={<Destination />} />
</Routes></MemoryRouter>);
beforeEach(() => {
  sessionStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (useStudioAccount as jest.Mock).mockReturnValue('clerk:alice');
});
it('shows the assessment without presenting global confidence or an invented future score', () => {
  view();
  expect(screen.getByText('Small headline')).toBeInTheDocument();
  expect(screen.queryByText(/High confidence|potential score/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Generate Better Thumbnail/ })).not.toBeInTheDocument();
});
it('opens the Studio create screen with the video title instead of generating images', () => {
  view();
  fireEvent.click(screen.getByRole('button', { name: 'Create a new thumbnail for this video' }));
  expect(screen.getByTestId('destination')).toHaveTextContent('/ai-thumbnails/generate');
  expect(loadStudioCreateDraft('clerk:alice')?.brief.videoTitle).toBe('My camera review');
});
it('prefills the anonymous create screen through its draft', () => {
  (useStudioAccount as jest.Mock).mockReturnValue('anonymous');
  view();
  fireEvent.click(screen.getByRole('button', { name: 'Create a new thumbnail for this video' }));
  const id = new URLSearchParams(screen.getByTestId('destination').textContent!.split('?')[1]).get('draft');
  expect(loadStudioDraft(id)?.draft.videoTitle).toBe('My camera review');
});
