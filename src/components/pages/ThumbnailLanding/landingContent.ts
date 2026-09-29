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
  subreddit: string;
  url: string;
}

/** Public Reddit threads about YouTube thumbnails. They are not reviews of AI Thumbnails. */
export const CREATOR_QUOTES: CreatorQuote[] = [
  {
    text: 'My thumbnail and titles look good to me but going by CTR, I am an idiot.',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1qgl0te/i_designed_346_thumbnails_for_small_youtubers/',
  },
  {
    text: 'I despise when I finish a video and doing the thumbnail because I can’t ever figure out what I want.',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1oawbnt/i_love_creating_videos_but_despise_doing/',
  },
  {
    text: 'the average answer was: 1 hour 45 minutes per thumbnail.',
    subreddit: 'r/PartneredYoutube',
    url: 'https://www.reddit.com/r/PartneredYoutube/comments/1oo0rnk/how_much_time_do_you_spend_making_thumbnails_i/',
  },
  {
    text: 'I dread going into places like Fiverr etc where 99% of people will charge me just end up using ChatGPT',
    subreddit: 'r/NewTubers',
    url: 'https://www.reddit.com/r/NewTubers/comments/1vb4cyc/where_to_find_a_good_thumbnail_designer/',
  },
  {
    text: 'One of my biggest goals is to create a recognisable visual identity.',
    subreddit: 'r/DesignJobs',
    url: 'https://www.reddit.com/r/DesignJobs/comments/1up5yvj/hiring_thumbnail_designer_for_longterm_youtube/',
  },
  {
    text: 'AI is welcome as long as your thumbnails are good quality. No to AI slop!',
    subreddit: 'r/Thumbnails',
    url: 'https://www.reddit.com/r/Thumbnails/comments/1w6bsmo/i_need_a_thumbnail_designer_for_my_channels/',
  },
  {
    text: 'Most creators pick one thumbnail concept, upload it, and hope. no comparison, no data, just a gut call.',
    subreddit: 'r/Thumbnails',
    url: 'https://www.reddit.com/r/Thumbnails/comments/1vnjpbd/why_testing_one_thumbnail_idea_against_nothing_is/',
  },
  {
    text: 'I started rebranding my thumbnails so they have a consistent look, and I improved their quality... my views have doubled in a month on the same old content.',
    subreddit: 'r/PartneredYoutube',
    url: 'https://www.reddit.com/r/PartneredYoutube/comments/1pnrbne/updating_thumbnails_has_revived_my_channel_views/',
  },
];
