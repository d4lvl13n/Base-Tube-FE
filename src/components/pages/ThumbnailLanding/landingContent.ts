// The fixed facts and quotes of the AI Thumbnails landing page. Prices, videos
// and the free trial are never written here: they come from GET
// /api/v1/subscriptions/plans.

/**
 * Market research, not a product number: the median price of one YouTube
 * thumbnail across 43 designer price quotes (the owner's study of Reddit
 * threads, September 2026).
 */
export const DESIGNER_THUMBNAIL_PRICE = { price: '$25', quotes: 43 } as const;

/** One video is three ideas: YouTube's Test & Compare takes up to three thumbnails. */
export const THUMBNAILS_PER_VIDEO = 3;

/** The hero's background video and its still (dropped in by the owner; the page works without them). */
export const HERO_VIDEO_SRC = '/assets/ai-thumbnails/hero-background.mp4';
export const HERO_POSTER_SRC = '/assets/ai-thumbnails/hero-poster.jpg';

export interface CreatorQuote {
  /** Verbatim, as posted. */
  text: string;
  /** The words the highlighter marks: an exact part of `text`. */
  mark: string;
  subreddit: string;
  url: string;
}

/** Public Reddit threads about YouTube thumbnails. They are not reviews of AI Thumbnails. */
export const CREATOR_QUOTES: CreatorQuote[] = [
  {
    text: 'My thumbnail and titles look good to me but going by CTR, I am an idiot.',
    mark: 'going by CTR, I am an idiot',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1qgl0te/i_designed_346_thumbnails_for_small_youtubers/',
  },
  {
    text: 'I despise when I finish a video and doing the thumbnail because I can’t ever figure out what I want.',
    mark: 'I can’t ever figure out what I want',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1oawbnt/i_love_creating_videos_but_despise_doing/',
  },
  {
    text: 'the average answer was: 1 hour 45 minutes per thumbnail.',
    mark: '1 hour 45 minutes per thumbnail',
    subreddit: 'r/PartneredYoutube',
    url: 'https://www.reddit.com/r/PartneredYoutube/comments/1oo0rnk/how_much_time_do_you_spend_making_thumbnails_i/',
  },
  {
    text: 'I dread going into places like Fiverr etc where 99% of people will charge me just end up using ChatGPT',
    mark: 'end up using ChatGPT',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1vb4cyc/where_to_find_a_good_thumbnail_designer/',
  },
  {
    text: 'One of my biggest goals is to create a recognisable visual identity.',
    mark: 'a recognisable visual identity',
    subreddit: 'r/DesignJobs',
    url: 'https://www.reddit.com/r/DesignJobs/comments/1up5yvj/hiring_thumbnail_designer_for_longterm_youtube/',
  },
  {
    text: 'AI is welcome as long as your thumbnails are good quality. No to AI slop!',
    mark: 'No to AI slop!',
    subreddit: 'r/Thumbnails',
    url: 'https://www.reddit.com/r/Thumbnails/comments/1w6bsmo/i_need_a_thumbnail_designer_for_my_channels/',
  },
  {
    text: 'Most creators pick one thumbnail concept, upload it, and hope. no comparison, no data, just a gut call.',
    mark: 'just a gut call',
    subreddit: 'r/Thumbnails',
    url: 'https://www.reddit.com/r/Thumbnails/comments/1vnjpbd/why_testing_one_thumbnail_idea_against_nothing_is/',
  },
  {
    text: 'I started rebranding my thumbnails so they have a consistent look, and I improved their quality... my views have doubled in a month on the same old content.',
    mark: 'my views have doubled in a month',
    subreddit: 'r/PartneredYoutube',
    url: 'https://www.reddit.com/r/PartneredYoutube/comments/1pnrbne/updating_thumbnails_has_revived_my_channel_views/',
  },
];

/**
 * Example thumbnails for the page's visuals. The pictures were made with Grok Imagine, the image
 * model the Studio uses for new images (29 September 2026); titles are real type set on top, as the
 * Studio's text works. Fictional videos and people. Replace with real Studio outputs when there are some.
 */
export interface ExampleThumbnail {
  src: string;
  title: string;
  /** Where the title sits on the picture. */
  place: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tone: 'yellow' | 'white';
}

const EXAMPLES_DIR = '/assets/ai-thumbnails/examples';

export const EXAMPLE_THUMBNAILS: ExampleThumbnail[] = [
  { src: `${EXAMPLES_DIR}/phone.webp`, title: 'It’s finally here', place: 'top-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/burger.webp`, title: 'Smash burger at home', place: 'top-left', tone: 'white' },
  { src: `${EXAMPLES_DIR}/fjord.webp`, title: 'Norway on $50 a day', place: 'top-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/gamer.webp`, title: 'I broke the record', place: 'bottom-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/garage.webp`, title: 'Barn find revival', place: 'top-right', tone: 'white' },
  { src: `${EXAMPLES_DIR}/receipts.webp`, title: 'Where my money went', place: 'top-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/deadlift.webp`, title: '90 days of deadlifts', place: 'bottom-left', tone: 'white' },
  { src: `${EXAMPLES_DIR}/paint.webp`, title: '$200 room makeover', place: 'top-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/telescope.webp`, title: 'See Saturn tonight', place: 'bottom-right', tone: 'white' },
  { src: `${EXAMPLES_DIR}/tomato.webp`, title: 'Giant tomatoes, 1 trick', place: 'top-left', tone: 'yellow' },
  { src: `${EXAMPLES_DIR}/van.webp`, title: 'Living in a van', place: 'top-left', tone: 'white' },
  { src: `${EXAMPLES_DIR}/latte.webp`, title: 'Café latte at home', place: 'top-left', tone: 'white' },
];

const DEMO_DIR = '/assets/ai-thumbnails/demo';

/** The Studio demo: one fictional channel, its face photo, three ideas for one video and one edit. */
export const DEMO = {
  channel: 'Maya’s Coffee Lab',
  face: `${DEMO_DIR}/face.webp`,
  swatches: ['#f2b300', '#6b3f1d', '#f3e7d3'],
  rules: ['Warm café light', 'Yellow apron in frame', 'Four words of title at most'],
  link: 'youtube.com/watch?v=… “I tested 5 budget espresso machines”',
  edit: 'Warmer light, more steam',
  ideas: [
    { src: `${DEMO_DIR}/idea1.webp`, edited: `${DEMO_DIR}/idea1-edit.webp`, title: 'This $49 one won', place: 'top-right' as const, tone: 'yellow' as const, alt: 'The creator sipping an espresso, surprised, a steaming machine behind her' },
    { src: `${DEMO_DIR}/idea2.webp`, title: '5 machines, 1 winner', place: 'top-left' as const, tone: 'white' as const, alt: 'The creator behind five espresso machines in a row, arms crossed' },
    { src: `${DEMO_DIR}/idea3.webp`, title: 'Don’t buy this one', place: 'top-right' as const, tone: 'yellow' as const, alt: 'The creator pointing at a small red machine next to a large chrome one' },
  ],
} as const;
