import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuditCreatorPlan } from '../AuditCreatorPlan';
jest.mock('../../../../../hooks/useStudioAccount', () => ({ useStudioAccount: () => 'clerk:qa' }));

it('does not present an arbitrary family example as a proposed test variant', () => {
  const usual = { videoId: 'three-panels', title: 'Usual three panels', thumbnailUrl: '/usual.jpg', views: 25000 };
  const standout = { videoId: 'map', title: 'Standout map', thumbnailUrl: '/map.jpg', views: 770000 };
  const audit: any = { perVideo: [usual, standout], reviewQueue: { medianViews: 25000 }, swipeFile: { examples: [] }, comparativeSummary: { standoutVideoId: 'map', contrasts: [{ dimension: 'Layout', exampleVideoId: 'three-panels', exampleFact: 'Three panels', standoutFact: 'A map', standoutVideoId: 'map' }] } };
  const plan: any = { diagnosis: 'Compare the layouts.', families: [{ name: 'Three panels', description: 'Recurring layout', evidence: [{ videoId: 'three-panels', observationIndex: 0 }] }], ideas: [], test: 'Try both on the same future video.', testCurrent: 'Two scenes with a face.', testNew: 'A single map and route.' };
  render(<MemoryRouter><AuditCreatorPlan audit={audit} plan={plan} /></MemoryRouter>);
  const testSection = screen.getByRole('heading', { name: 'Your usual format against the new one' }).closest('section')!;
  expect(within(testSection).getByText('Two scenes with a face.')).toBeVisible();
  expect(within(testSection).getByText('A single map and route.')).toBeVisible();
  expect(within(testSection).queryByRole('img')).not.toBeInTheDocument();
  // Real source thumbnails remain in the evidence comparison and families.
  expect(screen.getAllByRole('img', { name: 'Usual three panels' })).toHaveLength(2);
  expect(screen.getByRole('img', { name: 'Standout map' })).toBeInTheDocument();
});
