// src/mocks/channelAuditV2.fixture.ts
// A complete, valid ChannelPackagingAuditV2 object used to build and verify the
// v2 report without a backend. Shapes MUST match the frozen v2 audit contract in
// base-be `docs/specs/moat-phase-0-1-spec.md` — that contract is the sync point
// between this repo and the backend fixture (`tests/fixtures/channelAuditV2.fixture.ts`).
//
// Content is invented (a small gaming channel) but deliberately obeys the
// product rules: `observed` = countable facts only, `hypothesis` = hedged and
// non-causal, experiments are falsifiable and priority-ordered from 1.

import type { ChannelPackagingAudit, ChannelPackagingAuditV2 } from '../types/ctr';

export const channelAuditV2Fixture: ChannelPackagingAuditV2 = {
  schemaVersion: 2,
  mode: 'connected',
  id: 4821,
  channel: {
    title: 'Deadzone Diaries',
    subscribers: 8420,
    niche: 'Extraction shooters (Tarkov / Hunt: Showdown)',
    videosAnalyzed: 8,
  },
  positioning:
    'A solo extraction-shooter channel built around full, uncut raid runs with live commentary — closer to a "watch someone actually play well" channel than a tips-and-meta channel. The recurring hook is survival under pressure: high-value loot carried out, or lost, in one continuous run.',
  headline:
    '7 of 8 thumbnails carry 3+ competing focal elements, and the title repeats the thumbnail text on 5 of them — the packaging is describing the raid rather than framing a stake.',
  perVideo: [
    {
      videoId: 'k3JmQ1rTt0A',
      title: 'I Took 12 Million Roubles Into Labs (Solo Raid)',
      views: 41200,
      thumbnailUrl: 'https://i.ytimg.com/vi/k3JmQ1rTt0A/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=k3JmQ1rTt0A',
      observed: [
        '5 words of overlay text ("12 MILLION INTO LABS")',
        'Text repeats 4 of the 8 title words',
        'Three focal elements: face (bottom-left), weapon, loot pile',
        'Face occupies roughly 15% of the frame',
        'Dark background, no rim light separating the subject',
      ],
      hypothesis:
        'With the overlay repeating the title almost verbatim, the thumbnail may be spending its space on information a viewer already has from the title rather than on a second, complementary idea.',
      experimentId: 'exp-text-title-split',
      metrics: {
        impressions: 612000,
        ctr: 5.1,
        averageViewDuration: 402,
        evidenceStrength: 'observational',
        dominantTrafficSource: 'Browse features',
        baselineDelta: 'above your browse-matched baseline',
      },
    },
    {
      videoId: 'p8Vw2LnQdZk',
      title: 'The Scav Run That Went Completely Wrong',
      views: 6800,
      thumbnailUrl: 'https://i.ytimg.com/vi/p8Vw2LnQdZk/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=p8Vw2LnQdZk',
      observed: [
        'No overlay text',
        'Four distinguishable elements: two players, a vehicle, a map marker',
        'Largest subject occupies roughly 20% of the frame',
        'Mid-grey background, subject value close to background value',
        'No template element shared with the other 7 thumbnails',
      ],
      hypothesis:
        'At feed size the four similarly-sized elements could read as one texture, which may make the frame harder to parse in the ~1 second a browse impression gets.',
      experimentId: 'exp-single-subject',
      metrics: {
        impressions: 88000,
        ctr: 2.4,
        averageViewDuration: 191,
        evidenceStrength: 'directional',
        dominantTrafficSource: 'Browse features',
        baselineDelta: 'below your browse-matched baseline',
      },
    },
    {
      videoId: 'r2Xy9BbNq4E',
      title: 'Every Hunt: Showdown Boss, Ranked By How Much I Hate Them',
      views: 12400,
      thumbnailUrl: 'https://i.ytimg.com/vi/r2Xy9BbNq4E/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=r2Xy9BbNq4E',
      observed: [
        '11 words in the title — longest in the sample',
        '9 words of overlay text ("RANKED: EVERY BOSS FROM WORST TO BEST")',
        'Overlay text set at roughly 4% of frame height',
        'Five boss portraits tiled across the frame',
        'No face present',
      ],
      hypothesis:
        'The overlay is the smallest type in the sample and sits over a busy tile grid; it may be functioning as a caption rather than as a hook a viewer can read at feed size.',
      experimentId: 'exp-text-title-split',
      metrics: {
        impressions: 143000,
        ctr: 3.3,
        averageViewDuration: 288,
        evidenceStrength: 'directional',
        dominantTrafficSource: 'YouTube search',
        baselineDelta: null,
      },
    },
    {
      videoId: 'w7Kd4MsPl1U',
      title: 'Solo Vs Duos: 4 Extracts In A Row',
      views: 9100,
      thumbnailUrl: 'https://i.ytimg.com/vi/w7Kd4MsPl1U/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=w7Kd4MsPl1U',
      observed: [
        '3 words of overlay text ("4 IN A ROW")',
        'Face present, roughly 12% of the frame, neutral expression',
        'Two weapons and a HUD fragment also in frame',
        'Cool blue grade — the only cool-graded thumbnail in the sample',
        'Overlay text placed bottom-right, partially over the HUD fragment',
      ],
      hypothesis:
        'This is the only cool-graded frame in an otherwise warm set, so it may not read as the same channel when it appears next to the others on a channel page or in a suggested column.',
      experimentId: 'exp-consistent-grade',
      metrics: {
        impressions: 96000,
        ctr: 2.9,
        averageViewDuration: 246,
        evidenceStrength: 'directional',
        dominantTrafficSource: 'Suggested videos',
        baselineDelta: 'below your browse-matched baseline',
      },
    },
    {
      videoId: 'y5Tn8ZqRc6M',
      title: 'I Only Used A Pistol For 10 Raids',
      views: 27600,
      thumbnailUrl: 'https://i.ytimg.com/vi/y5Tn8ZqRc6M/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=y5Tn8ZqRc6M',
      observed: [
        '2 words of overlay text ("PISTOL ONLY")',
        'Single focal subject: the pistol, roughly 40% of the frame',
        'Face present at roughly 10% of the frame, wide-eyed expression',
        'High contrast between subject and background',
        'Overlay text does not repeat any title word beyond "pistol"',
      ],
      hypothesis:
        'This is the only frame in the sample with one dominant subject and a two-word overlay; it may be the cleanest existing reference point for a template test.',
      experimentId: 'exp-single-subject',
      metrics: {
        impressions: 388000,
        ctr: 4.6,
        averageViewDuration: 371,
        evidenceStrength: 'observational',
        dominantTrafficSource: 'Browse features',
        baselineDelta: 'above your browse-matched baseline',
      },
    },
    {
      videoId: 'g4Hb6VcXe9S',
      title: 'How I Fixed My Aim In One Week (Tarkov)',
      views: 5400,
      thumbnailUrl: 'https://i.ytimg.com/vi/g4Hb6VcXe9S/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=g4Hb6VcXe9S',
      observed: [
        '6 words of overlay text ("FIXED MY AIM IN 7 DAYS")',
        'Overlay text repeats 4 of the 8 title words',
        'Three focal elements: face, crosshair graphic, stat chart',
        'Stat chart occupies roughly 25% of the frame',
        'Two different fonts in the same frame',
      ],
      hypothesis:
        'The stat chart is the second-largest element but carries numbers unreadable at feed size, so it may be occupying space without contributing a legible idea.',
      experimentId: 'exp-single-subject',
      metrics: {
        impressions: 61000,
        ctr: 2.1,
        averageViewDuration: 168,
        evidenceStrength: 'insufficient',
        dominantTrafficSource: 'YouTube search',
        baselineDelta: null,
      },
    },
    {
      videoId: 'n9Fq3WdKu2P',
      title: 'This Loot Route Pays For Itself Every Single Raid',
      views: 8300,
      thumbnailUrl: 'https://i.ytimg.com/vi/n9Fq3WdKu2P/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=n9Fq3WdKu2P',
      observed: [
        '4 words of overlay text ("PAYS FOR ITSELF")',
        'Overlay text repeats 3 of the 9 title words',
        'Map screenshot fills the frame with a drawn route line',
        'No face present',
        'Route line is roughly 3px wide at 1280px export',
      ],
      hypothesis:
        'The route line is the informational core of the frame but is the thinnest element in it; at feed width it may not survive downscaling.',
      experimentId: 'exp-consistent-grade',
      metrics: {
        impressions: 74000,
        ctr: 2.6,
        averageViewDuration: 205,
        evidenceStrength: 'directional',
        dominantTrafficSource: 'YouTube search',
        baselineDelta: 'below your browse-matched baseline',
      },
    },
    {
      videoId: 'c1Ls7RtYo3D',
      title: 'Losing 40 Hours Of Progress In 90 Seconds',
      views: 33800,
      thumbnailUrl: 'https://i.ytimg.com/vi/c1Ls7RtYo3D/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=c1Ls7RtYo3D',
      observed: [
        '3 words of overlay text ("40 HOURS GONE")',
        'Face present at roughly 22% of the frame — largest face in the sample',
        'Two focal elements only: face and inventory grid',
        'Warm grade consistent with 6 of the 8 thumbnails',
        'Overlay text introduces a number absent from the thumbnail image',
      ],
      hypothesis:
        'This frame pairs the largest face with the fewest elements in the sample; the combination may be worth isolating as a variable rather than assumed to be the reason it did well.',
      experimentId: null,
      metrics: {
        impressions: 421000,
        ctr: 5.4,
        averageViewDuration: 388,
        evidenceStrength: 'observational',
        dominantTrafficSource: 'Browse features',
        baselineDelta: 'above your browse-matched baseline',
      },
    },
  ],
  experiments: [
    {
      id: 'exp-text-title-split',
      title: 'Stop the thumbnail from repeating the title',
      hypothesis:
        'If the overlay text carries a second idea instead of restating the title, the title+thumbnail pair may communicate two things in the same impression rather than one thing twice.',
      variantBrief: {
        thumbnail:
          'Same raid footage frame, but the overlay reduced to two words that are NOT in the title — the consequence, not the setup (e.g. "NO EXTRACT"). Single subject at 35-45% of frame, face turned toward the subject, warm grade, one font, no HUD fragments, no stat chart.',
        title: 'I Took 12 Million Roubles Into Labs (Solo Raid)',
      },
      method:
        'YouTube Test & Compare, 2 variants, run until ≥5,000 impressions per variant or 7 days, whichever comes first.',
      priority: 1,
      videoIds: ['k3JmQ1rTt0A', 'r2Xy9BbNq4E'],
    },
    {
      id: 'exp-single-subject',
      title: 'One dominant subject instead of three competing ones',
      hypothesis:
        'If a single subject occupies 35-45% of the frame with everything else removed, the frame may be parseable at feed size in a way the current 3-4 element layouts are not.',
      variantBrief: {
        thumbnail:
          'Rebuild the frame around ONE subject — the weapon or the loot, not both — at 35-45% of the frame, cut out and lit against a darkened, blurred raid background. Delete the HUD fragment, the stat chart and the secondary player. Keep the overlay to two words, top-left, high-contrast.',
      },
      method:
        'YouTube Test & Compare, 2 variants (current vs single-subject), ≥5,000 impressions per variant.',
      priority: 2,
      videoIds: ['p8Vw2LnQdZk', 'y5Tn8ZqRc6M', 'g4Hb6VcXe9S'],
    },
    {
      id: 'exp-consistent-grade',
      title: 'One channel grade across the set',
      hypothesis:
        'If every thumbnail shares the warm grade used by 6 of 8, the set may become recognisable as one channel in a suggested column — testable per video, observable across the channel page.',
      variantBrief: {
        thumbnail:
          'Regrade to the channel-standard warm look: amber key light on the subject, cooled/darkened background, subject separated with a thin warm rim light. Thicken any drawn line work to ≥8px at 1280px export so it survives feed downscaling.',
        title: 'Solo Vs Duos: 4 Extracts In A Row',
      },
      method:
        'YouTube Test & Compare, 2 variants, ≥5,000 impressions per variant; then re-check the channel page as a set.',
      priority: 3,
      videoIds: ['w7Kd4MsPl1U', 'n9Fq3WdKu2P'],
    },
  ],
  swipeFile: {
    searchQueries: [
      'tarkov solo raid labs',
      'hunt showdown solo bounty',
      'extraction shooter loot run',
    ],
    size: {
      match: 'aspirational',
      minSubscribers: 120000,
      maxSubscribers: 940000,
      label: 'larger channels — 120K to 940K subscribers',
    },
    examples: [
      {
        title: 'The Most Expensive Raid I Have Ever Run',
        channelTitle: 'Nightwatch Extraction',
        subscribers: 412000,
        views: 1840000,
        thumbnailUrl: 'https://i.ytimg.com/vi/Aq7dW1sVxQ8/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=Aq7dW1sVxQ8',
        channelUrl: 'https://www.youtube.com/@nightwatchextraction',
        whyInteresting:
          'Two words of overlay text and one subject at roughly half the frame — the title carries the setup, the thumbnail carries the consequence.',
      },
      {
        title: 'I Survived 100 Raids Without Dying Once',
        channelTitle: 'Loot Goblin Labs',
        subscribers: 938000,
        views: 3120000,
        thumbnailUrl: 'https://i.ytimg.com/vi/Bx2Kp9LmNn4/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=Bx2Kp9LmNn4',
        channelUrl: 'https://www.youtube.com/@lootgoblinlabs',
        whyInteresting:
          'No overlay text at all — the number lives entirely in the title, and the frame is one face at roughly 30% with a hard rim light.',
      },
      {
        title: 'Hunt: Showdown But I Only Use The Cheapest Loadout',
        channelTitle: 'Bayou Business',
        subscribers: 176000,
        views: 640000,
        thumbnailUrl: 'https://i.ytimg.com/vi/Cd8Yt3RqWs1/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=Cd8Yt3RqWs1',
        channelUrl: 'https://www.youtube.com/@bayoubusiness',
        whyInteresting:
          'Consistent grade and one recurring layout across the whole channel page — the set is recognisable before any single title is read.',
      },
      {
        title: 'This Is Why You Keep Dying On Extract',
        channelTitle: 'Deadside Tactics',
        subscribers: 124000,
        views: 388000,
        thumbnailUrl: 'https://i.ytimg.com/vi/De5Uh7BnKp2/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=De5Uh7BnKp2',
        channelUrl: 'https://www.youtube.com/@deadsidetactics',
        whyInteresting:
          'Overlay text and title share zero words; the thumbnail names the mistake, the title names the audience.',
      },
    ],
  },
  reviewQueue: {
    medianViews: 10750,
    high: [
      { videoId: 'k3JmQ1rTt0A', title: 'I Took 12 Million Roubles Into Labs (Solo Raid)', views: 41200 },
      { videoId: 'c1Ls7RtYo3D', title: 'Losing 40 Hours Of Progress In 90 Seconds', views: 33800 },
      { videoId: 'y5Tn8ZqRc6M', title: 'I Only Used A Pistol For 10 Raids', views: 27600 },
    ],
    low: [
      { videoId: 'g4Hb6VcXe9S', title: 'How I Fixed My Aim In One Week (Tarkov)', views: 5400 },
      { videoId: 'p8Vw2LnQdZk', title: 'The Scav Run That Went Completely Wrong', views: 6800 },
      { videoId: 'n9Fq3WdKu2P', title: 'This Loot Route Pays For Itself Every Single Raid', views: 8300 },
    ],
  },
  analyticsStatus: 'ready',
};

/**
 * Preview mode: the same audit as an anonymous/unconnected visitor sees it —
 * capped sample, no `metrics`, no `analyticsStatus`. Used to verify the report
 * degrades cleanly when the connected-only fields are absent.
 */
export const channelAuditV2PreviewFixture: ChannelPackagingAuditV2 = {
  ...channelAuditV2Fixture,
  mode: 'preview',
  analyticsStatus: undefined,
  channel: { ...channelAuditV2Fixture.channel, videosAnalyzed: 3 },
  perVideo: channelAuditV2Fixture.perVideo.slice(0, 3).map(({ metrics, ...rest }) => rest),
};

/** Connected but still ingesting — the "first metrics can take up to 48h" state. */
export const channelAuditV2SyncingFixture: ChannelPackagingAuditV2 = {
  ...channelAuditV2Fixture,
  analyticsStatus: 'syncing',
  perVideo: channelAuditV2Fixture.perVideo.map(({ metrics, ...rest }) => rest),
};

/**
 * Preview because the creator audited a channel that is NOT the one they linked.
 * (`connectionStatus` is ADDITIVE — it can be absent entirely, which is exactly
 * what `channelAuditV2PreviewFixture` above covers.)
 */
export const channelAuditV2MismatchedFixture: ChannelPackagingAuditV2 = {
  ...channelAuditV2PreviewFixture,
  connectionStatus: 'mismatched',
};

/** Connected, then the grant died — the report degrades to public data. */
export const channelAuditV2ReauthFixture: ChannelPackagingAuditV2 = {
  ...channelAuditV2PreviewFixture,
  connectionStatus: 'reauth_required',
  analyticsStatus: 'reauth_required',
};

/**
 * A LEGACY (v1) row as the backend now serves it (`schemaVersion: 1`), used to
 * verify the minimal legacy view. Shape is deliberately partial — old rows do
 * not all carry every v1 block.
 */
export const channelAuditV1LegacyFixture: ChannelPackagingAudit = {
  schemaVersion: 1,
  channel: {
    title: 'Deadzone Diaries',
    subscribers: 8420,
    niche: 'gaming',
    videosAnalyzed: 5,
  },
  headline: 'Your packaging is inconsistent across the last 5 uploads.',
  perVideo: [
    {
      videoId: 'k3JmQ1rTt0A',
      title: 'I Took 12 Million Roubles Into Labs (Solo Raid)',
      views: 41200,
      thumbnailUrl: 'https://i.ytimg.com/vi/k3JmQ1rTt0A/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=k3JmQ1rTt0A',
      issues: ['Text repeats the title', 'Three competing focal elements'],
      fix: 'Cut the overlay to two words and drop the loot pile.',
      score: 6,
    },
    {
      videoId: 'p8Vw2LnQdZk',
      title: 'The Scav Run That Went Completely Wrong',
      views: 6800,
      thumbnailUrl: 'https://i.ytimg.com/vi/p8Vw2LnQdZk/hqdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=p8Vw2LnQdZk',
      issues: ['No overlay text', 'Low subject/background contrast'],
      fix: 'Isolate one subject and light it against a darkened background.',
      score: 4,
    },
  ],
};

export default channelAuditV2Fixture;
