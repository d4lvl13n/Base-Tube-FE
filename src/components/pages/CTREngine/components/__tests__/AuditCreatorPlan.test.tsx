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

it('shows the creator layout for an audit without a plan', () => {
  const videos = [
    { videoId: 'a', title: 'Usual review', thumbnailUrl: '/a.jpg', views: 30000 },
    { videoId: 'b', title: 'Most viewed review', thumbnailUrl: '/b.jpg', views: 60000 },
    { videoId: 'c', title: 'Small news', thumbnailUrl: '/c.jpg', views: 10000 },
  ];
  const audit: any = {
    channel: { title: 'Mag', subscribers: 427000, videosAnalyzed: 3 },
    positioning: 'Mag covers French gaming news.',
    headline: 'Titles name the game, thumbnails show a verdict.',
    perVideo: videos,
    reviewQueue: { medianViews: 30000 },
    swipeFile: { examples: [] },
    experiments: [{ id: 'e1', title: 'Verdict', hypothesis: 'A clearer verdict may read faster.', variantBrief: { thumbnail: 'Game art with one word: "PRENANT".' }, method: 'Test & Compare', priority: 1, videoIds: ['c'] }],
    publicReview: { decisions: [{ id: 'd1', title: 'Align the review label', evidence: [{ videoId: 'c', observationIndex: 0 }], possibleIssue: 'The thumbnail says test, the description says review.', change: 'Use one label.' }] },
  };
  render(<MemoryRouter><AuditCreatorPlan audit={audit} /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: 'Mag covers French gaming news.' })).toBeInTheDocument();
  expect(screen.getAllByText('Your most viewed').length).toBeGreaterThan(0);
  expect(screen.getByText('2×')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'One video worth a new thumbnail' })).toBeInTheDocument();
  expect(screen.getByText('Game art with one word: "PRENANT".')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Create this thumbnail/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'One thing to correct' })).toBeInTheDocument();
  expect(screen.queryByText(/broke out/)).not.toBeInTheDocument();
});
