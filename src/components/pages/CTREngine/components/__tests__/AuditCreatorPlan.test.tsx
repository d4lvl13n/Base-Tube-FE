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

it('leads with formats, findings and views per month when the backend sends them', () => {
  const v = (videoId: string, title: string, views: number, viewsPerMonth: number, publishedAt: string) =>
    ({ videoId, title, views, viewsPerMonth, publishedAt, thumbnailUrl: `/${videoId}.jpg`, videoUrl: '', observed: [], hypothesis: '', experimentId: null });
  const gta = v('gta', 'GTA 6 Is Secretly Red Dead 3', 1407, 740.8, '2026-08-31T19:34:03Z');
  const guide = v('guide', 'How to Beat Daidara', 30, 19.7, '2026-09-12T07:55:41Z');
  const skull = v('skull', 'Is Skull and Bones the Next Big Pirate Adventure?', 8091, 235.9, '2023-12-19T00:00:00Z');
  const group = (key: string, label: string, count: number, medianViews: number, medianViewsPerMonth: number, bestVideoId: string) =>
    ({ key, label, count, datedCount: count, videoIds: [], medianViews, medianViewsPerMonth, minViews: 1, maxViews: 2, bestVideoId });
  const audit: any = {
    channel: { title: 'FinalBoss', subscribers: 1000, videosAnalyzed: 30 },
    positioning: 'Guides: 4 videos with a median of 33 views.',
    headline: 'Guides: 4 videos with a median of 33 views.',
    perVideo: [guide, gta, skull],
    reviewQueue: { medianViews: 484, basis: 'views_per_month', medianViewsPerMonth: 19.7, usualVideoId: 'guide', standoutVideoId: 'gta', high: [], low: [] },
    swipeFile: { examples: [] },
    publicResearch: {
      statistics: {
        version: '1', asOf: '2026-10-28T15:01:48Z', medianViews: 484, medianViewsPerMonth: 19.7, usualVideoId: 'guide', standoutVideoId: 'gta',
        formats: [
          group('gameplay_replay', 'Gameplay replays', 4, 72, 1.96, 'guide'),
          group('one_game_preview_opinion', 'One-game previews/opinions', 5, 1407, 141.33, 'gta'),
          group('review', 'Reviews', 1, 963, 27.1, 'skull'),
        ],
        publicationYears: [], sample: { datedCount: 27, undatedVideoIds: [], spanMonths: 35.4, maxUploadGapMonths: 18.8, flags: [] },
      },
    },
    publicReview: {
      findings: [
        { headline: 'Guides: 4 videos with a median of 33 views.', detail: 'Gameplay replays: 58 to 83 lifetime views, median 72 views. Reviews: 963 to 963 lifetime views.', videoIds: ['a', 'b', 'c', 'd', 'e'], action: 'For the next video, develop a one-game opinion.' },
        { headline: '“GTA 6 Is Secretly Red Dead 3” averages 740.8 views per month.', detail: 'The lifetime-view leader, “Is Skull and Bones the Next Big Pirate Adventure? Exclusive Beta Insight”, has 8091 views. It averages 235.9 views per month.', videoIds: ['gta', 'guide', 'skull'], action: 'Compare their subject and format.' },
      ],
    },
  };
  render(<MemoryRouter><AuditCreatorPlan audit={audit} /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: 'Your one-game previews/opinions get 141 views a month. Your gameplay replays get 2.' })).toBeInTheDocument();
  expect(screen.getByText('38×')).toBeInTheDocument();
  expect(screen.getByText('your usual views per month')).toBeInTheDocument();
  expect(screen.getByText(/median pace of the videos analysed: 19.7 views a month/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '2 things your numbers show' })).toBeInTheDocument();
  const table = screen.getByRole('table', { name: 'Views by format' });
  expect(within(table).getByText('One-game previews/opinions')).toBeInTheDocument();
  expect(within(table).getByText('141')).toBeInTheDocument();
  // Sentences already in the format table are not repeated under the finding.
  expect(screen.queryByText(/Gameplay replays: 58 to 83/)).not.toBeInTheDocument();
  expect(screen.getByText('The lifetime-view leader, “Is Skull and Bones the Next Big Pirate Adventure? Exclusive Beta Insight”, has 8091 views.')).toBeInTheDocument();
  expect(screen.getByText('Develop a one-game opinion.')).toBeInTheDocument();
  expect(screen.getAllByText(/741 views a month · since Aug 2026/).length).toBeGreaterThan(0);
  // The positioning repeated as headline is not shown twice.
  expect(screen.queryAllByText('Guides: 4 videos with a median of 33 views.')).toHaveLength(1);
});
