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

it('shows what we saw in the videos, with quotes linked to their moment', () => {
  const quote = { id: 'gta:0', videoId: 'gta', kind: 'quote', quote: "I don't think Rockstar is making a bigger GTA 5", atSeconds: 3.4, note: 'A thesis in the first sentence.' };
  const frame = { id: 'gta:1', videoId: 'gta', kind: 'frame', atSeconds: 65, image: 'data:image/jpeg;base64,AAAA', note: 'Trailer footage with the channel mark.' };
  const audit: any = {
    channel: { title: 'FinalBoss', subscribers: 1000, videosAnalyzed: 30 },
    positioning: 'FinalBoss covers games.',
    headline: '',
    perVideo: [{ videoId: 'gta', title: 'GTA 6 Is Secretly Red Dead 3', views: 1407, thumbnailUrl: '/gta.jpg', videoUrl: '', observed: [], hypothesis: '', experimentId: null }],
    reviewQueue: { medianViews: 484, high: [], low: [] },
    swipeFile: { examples: [] },
    channelUnderstanding: {
      version: '1',
      generatedAt: '2026-10-28T18:00:00Z',
      limitations: ['No transcript for "Ryu vs Ken"; it was read from its frames only.'],
      findings: [
        { headline: 'Your fastest videos open on your own verdict.', explanation: 'The GTA 6 video states its thesis at once.', confidence: 'clear', action: 'Open on your verdict.', videoIds: ['gta'], evidence: [quote, frame] },
      ],
      videos: [
        { videoId: 'gta', title: 'GTA 6 Is Secretly Red Dead 3', views: 1407, viewsPerMonth: 740.8, publishedAt: '2026-08-31T19:34:03Z', durationSeconds: 582, roles: ['fastest'], transcript: 'read', framesSeen: 27, format: 'Opinion on an upcoming game', summary: 'An argument about GTA 6.', hook: quote, ownContribution: 'own_voice_over_other_footage', ownContributionNote: 'Own voice over trailer footage.', firstHand: null, delivery: 'Voice, no face.', evidence: [quote, frame] },
      ],
    },
  };
  render(<MemoryRouter><AuditCreatorPlan audit={audit} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'One thing that explains your channel' })).toBeInTheDocument();
  expect(screen.getByText('Seen in several videos')).toBeInTheDocument();
  const links = screen.getAllByRole('link', { name: '▶ 0:03' });
  expect(links[0]).toHaveAttribute('href', 'https://www.youtube.com/watch?v=gta&t=3s');
  expect(screen.getByRole('img', { name: 'Trailer footage with the channel mark.' })).toHaveAttribute('src', 'data:image/jpeg;base64,AAAA');
  expect(screen.getByRole('heading', { name: '1 of your videos, seen from the inside' })).toBeInTheDocument();
  expect(screen.getByText('How it opens')).toBeInTheDocument();
  expect(screen.getByText(/read from its frames only/)).toBeInTheDocument();
});

it('puts Shorts and long videos side by side, never in one median', () => {
  const group = (videos: any[], medianViews: number, medianViewsPerMonth: number, standoutVideoId: string) =>
    ({ version: '1', asOf: '2026-10-28', videos, formats: [], publicationYears: [], medianViews, medianViewsPerMonth, usualVideoId: null, standoutVideoId, sample: { datedCount: videos.length, undatedVideoIds: [], spanMonths: null, maxUploadGapMonths: null, flags: [] } });
  const longVideos = [{ videoId: 'gta', title: 'GTA 6 Is Secretly Red Dead 3', views: 1407, publishedAt: '2026-08-31T00:00:00Z', monthsOnline: 2, viewsPerMonth: 740.8, format: 'one_game_preview_opinion' }];
  const shortVideos = [{ videoId: 'discsShort1', title: 'The father of PlayStation is fine with Sony killing discs', views: 33000, publishedAt: '2026-09-01T00:00:00Z', monthsOnline: 1.9, viewsPerMonth: 17368, format: 'news' }];
  const audit: any = {
    channel: { title: 'FinalBoss', subscribers: 1000, videosAnalyzed: 30 },
    positioning: '', headline: '',
    perVideo: [{ videoId: 'gta', title: 'GTA 6 Is Secretly Red Dead 3', views: 1407, thumbnailUrl: '/gta.jpg', videoUrl: '', observed: [], hypothesis: '', experimentId: null }],
    reviewQueue: { medianViews: 484, high: [], low: [] },
    swipeFile: { examples: [] },
    publicResearch: { statistics: group(longVideos, 484, 24.7, 'gta'), shorts: { totalCount: null, statistics: group(shortVideos, 1000, 1050, 'discsShort1') } },
    channelUnderstanding: { version: '1', generatedAt: '', limitations: [], findings: [], videos: [
      { videoId: 'discsShort1', kind: 'short', title: 'The father of PlayStation is fine with Sony killing discs', views: 33000, viewsPerMonth: 17368, publishedAt: '2026-09-01T00:00:00Z', durationSeconds: 50, roles: ['most_viewed'], transcript: 'read', framesSeen: 9, format: 'news', summary: '', hook: null, ownContribution: 'own_voice_and_opinion', ownContributionNote: '', firstHand: null, delivery: '', evidence: [] },
      { videoId: 'gta', kind: 'long', title: 'GTA 6 Is Secretly Red Dead 3', views: 1407, viewsPerMonth: 740.8, publishedAt: '2026-08-31T00:00:00Z', durationSeconds: 582, roles: ['fastest'], transcript: 'read', framesSeen: 27, format: 'opinion', summary: '', hook: null, ownContribution: 'own_voice_and_opinion', ownContributionNote: '', firstHand: null, delivery: '', evidence: [] },
    ] },
  };
  render(<MemoryRouter><AuditCreatorPlan audit={audit} /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: /Your Shorts get 1,050 views a month\. Your long videos get 24\.7\./ })).toBeInTheDocument();
  expect(screen.getByText('1 Short analysed')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '1 long video and 1 Short, seen from the inside' })).toBeInTheDocument();
  expect(screen.getByText('Short · Most viewed')).toBeInTheDocument();
  const shortLink = screen.getAllByRole('link').find((a) => a.getAttribute('href')?.includes('/shorts/discsShort1'));
  expect(shortLink).toBeTruthy();
});
