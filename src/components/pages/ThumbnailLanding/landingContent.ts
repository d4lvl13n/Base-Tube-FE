// The fixed facts and quotes of the AI Thumbnails landing page. Prices, videos
// and the free trial are never written here: they come from GET
// /api/v1/subscriptions/plans.

/** The hero's background video and its still (dropped in by the owner; the page works without them). */
export const HERO_VIDEO_SRC = '/assets/ai-thumbnails/hero-background.mp4';
export const HERO_POSTER_SRC = '/assets/ai-thumbnails/hero-poster.jpg';

/** The product video under the hero (dropped in by the owner; the section stays hidden until the file loads). */
export const PRODUCT_VIDEO_SRC = '/assets/ai-thumbnails/product-video.mp4';
export const PRODUCT_VIDEO_POSTER_SRC = '/assets/ai-thumbnails/product-video-poster.jpg';

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
 * Example thumbnails for the page's visuals, made with AI Thumbnails itself (the Studio's batch
 * command, 29 September 2026): the headline is part of each image. Invented creators, channels and
 * videos, except the logos, which are the owner's own brands (Final Boss, Amazing Aerial, Codolie,
 * Procyon Metals, base.tube). The hero shows them as a YouTube feed: title, channel and length,
 * never view counts (they would claim results these thumbnails never had).
 */
export interface ExampleThumbnail {
  src: string;
  alt: string;
  /** The video's title under the thumbnail in the feed. */
  title: string;
  channel: string;
  /** The channel's round picture; null shows its initial. */
  avatar: string | null;
  duration: string;
}

const EXAMPLES_DIR = '/assets/ai-thumbnails/examples';
const CHANNELS_DIR = '/assets/ai-thumbnails/channels';
const CHANNELS: Record<string, { name: string; avatar: string | null }> = {
  finalboss: { name: 'Final Boss', avatar: 'finalboss' },
  amazingaerial: { name: 'Amazing Aerial', avatar: 'amazingaerial' },
  codolie: { name: 'Codolie', avatar: 'codolie' },
  procyon: { name: 'Procyon Metals', avatar: 'procyon' },
  basetube: { name: 'base.tube', avatar: 'basetube' },
  retire: { name: 'Retire Smart', avatar: 'sam' },
  garage: { name: 'Sam’s Garage', avatar: 'sam' },
  ana: { name: 'Ana Reviews', avatar: 'ana' },
  paris: { name: 'Paris Sessions', avatar: 'maya' },
  leo: { name: 'Leo Plays', avatar: 'leo' },
  tom: { name: 'Tom Trades', avatar: 'tom' },
  kai: { name: 'Kai Builds', avatar: 'kai' },
  kaiFr: { name: 'Kai Joue', avatar: 'kai' },
  ben: { name: 'Ben Publishes', avatar: 'ben' },
  sky: { name: 'Night Sky Club', avatar: null },
  money: { name: 'Money Leaks', avatar: null },
};
const example = (name: string, alt: string, title: string, channel: keyof typeof CHANNELS, duration: string): ExampleThumbnail => ({
  src: `${EXAMPLES_DIR}/${name}.webp`, alt, title, duration,
  channel: CHANNELS[channel].name, avatar: CHANNELS[channel].avatar && `${CHANNELS_DIR}/${CHANNELS[channel].avatar}.webp`,
});

export const EXAMPLE_THUMBNAILS: ExampleThumbnail[] = [
  example('finalboss-world-record', 'Final Boss: a gamer shocked in front of his screen, “New world record”', 'I beat the world record by 3 seconds', 'finalboss', '18:42'),
  example('lazy-money-300-day', 'A relaxed man with his feet on the desk and an app notification, “$300/day”', 'I tried the laziest way to make money with AI', 'retire', '33:19'),
  example('amazingaerial-norway', 'Amazing Aerial: a Norwegian fjord from above, “Norway from above”', 'Norway’s fjords from 400 feet', 'amazingaerial', '9:07'),
  example('before-you-buy', 'A woman in a blazer raising both palms, “Before you buy”', 'The new VR headset: before you buy', 'ana', '12:55'),
  example('codolie-automation', 'Codolie: a developer among purple cubes, “20 lines”', 'I automated my whole job with 20 lines of code', 'codolie', '14:21'),
  example('french-hits-2026', 'A DJ in a red beret on a Paris street, “Les plus beaux hits”', 'Playlist française 2026 : les plus beaux hits', 'paris', '59:35'),
  example('procyon-silver-gold', 'Procyon Metals: silver bars and a gold bar, “Silver vs gold”', 'Is silver the new gold?', 'procyon', '11:48'),
  example('reaction-no-way', 'A streamer with his hands on his head, laughing, “No way...”', 'He challenged me again... and quit again', 'leo', '22:50'),
  example('basetube-30-days', 'base.tube: a creator holding a camera, “30 days, 30 videos”', 'I posted a video every day for 30 days', 'basetube', '16:03'),
  example('day-trading-live', 'A serious trader next to a rising chart, “Day trading live”', 'Day trading live: I call every entry before the fill', 'tom', '1:19:22'),
  example('saturn-tonight', 'A telescope under the stars and Saturn, “Saturn tonight”', 'See Saturn’s rings tonight with a cheap telescope', 'sky', '8:36'),
  example('app-50k-month', 'A founder holding up a booking app, “$50K/month”', 'This simple widget makes $50K a month', 'kai', '13:39'),
  example('finalboss-200-hours', 'Final Boss: a gamer raising a glowing sword, “200 hours”', 'The rarest item in the game took me 200 hours', 'finalboss', '27:14'),
  example('made-200-books', 'A creator thinking in front of four book covers, “I made 200 books”', 'I made 200 books: how much money did I make?', 'ben', '16:42'),
  example('amazingaerial-lava', 'Amazing Aerial: a lava field from above, “Chasing the lava”', 'Flying a drone over an erupting volcano in Iceland', 'amazingaerial', '10:12'),
  example('premier-avis-1h', 'A creator in front of fantasy heroes, “1er avis après 1h de test”', 'Nouveau RPG : 1er avis après 1h de test', 'kaiFr', '26:24'),
  example('codolie-dev-tools', 'Codolie: a developer pointing at five glowing cubes, “5 dev tools”', '5 tools every developer needs in 2026', 'codolie', '11:05'),
  example('subscription-leaks', 'A long receipt and a card on white, “$1,100 a year”', '7 subscriptions quietly draining your money', 'money', '9:58'),
  example('procyon-gold-phone', 'Procyon Metals: an opened phone with gold flakes, “Gold in your phone?”', 'How much gold is inside a smartphone?', 'procyon', '13:27'),
  example('basetube-first-1000', 'base.tube: a creator celebrating in orange confetti, “1,000 subs”', 'My first 1,000 subscribers: what actually worked', 'basetube', '15:31'),
  example('barn-find-1972', 'An old rusty pickup in a barn with its owner, no text', 'Barn find: will this 1972 truck run again?', 'garage', '31:40'),
  example('finalboss-no-armor', 'Final Boss: a gamer facing a giant pixel monster, “No armor”', 'I fought the hardest boss with no armor', 'finalboss', '24:18'),
  example('amazingaerial-city-night', 'Amazing Aerial: a city at night from above, “The city at night”', 'A megacity at night from 500 feet', 'amazingaerial', '7:44'),
  example('codolie-mini-pc', 'Codolie: a developer holding a tiny computer, “$200 setup”', 'I replaced my laptop with a $200 mini PC', 'codolie', '17:52'),
  example('procyon-silver-mistakes', 'Procyon Metals: a collector holding a silver coin, “3 mistakes”', 'Buying silver coins: 3 mistakes to avoid', 'procyon', '12:09'),
  example('basetube-30-min-edit', 'base.tube: a creator with a stopwatch at her desk, “30-minute edit”', 'How I edit a full video in 30 minutes', 'basetube', '19:26'),
];

const DEMO_DIR = '/assets/ai-thumbnails/demo';

/**
 * The Studio demo: one invented channel, the face photo the Studio used, the three ideas it made
 * for one video, and one of them after the edit below (all made with AI Thumbnails).
 */
export const DEMO = {
  channel: 'Maya’s Coffee Lab',
  face: `${DEMO_DIR}/face.webp`,
  swatches: ['#f2b300', '#6b3f1d', '#f3e7d3'],
  rules: ['Warm café light', 'Yellow apron in frame', 'Five words of title at most'],
  link: 'youtube.com/watch?v=… “Cafe latte art at home with a $20 milk frother”',
  edit: 'Warmer light, more steam',
  ideas: [
    { src: `${DEMO_DIR}/idea1.webp`, edited: `${DEMO_DIR}/idea1-edit.webp`, alt: 'The creator pointing at a latte with a heart and a small frother, “$20 milk frother magic”' },
    { src: `${DEMO_DIR}/idea2.webp`, alt: 'The creator holding up a latte with a heart, “No machine needed!”' },
    { src: `${DEMO_DIR}/idea3.webp`, alt: 'A latte with a heart close to the camera, the creator smiling behind it, “Cafe latte art at home”' },
  ],
} as const;
