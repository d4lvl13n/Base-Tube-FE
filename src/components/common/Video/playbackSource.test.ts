import { selectPlaybackSource } from './playbackSource';

const ORIGINAL = 'https://cdn.example/original.mp4';
const SRC = 'https://cdn.example/src.mp4';

describe('selectPlaybackSource', () => {
  it('prefers a rendition over the published original', () => {
    expect(
      selectPlaybackSource({
        video_url: ORIGINAL,
        video_urls: { '720p': 'https://cdn.example/720.mp4' },
        src: SRC,
      }),
    ).toBe('https://cdn.example/720.mp4');
  });

  it('takes the highest rendition at or below 1080p', () => {
    expect(
      selectPlaybackSource({
        video_url: ORIGINAL,
        video_urls: {
          '480p': 'https://cdn.example/480.mp4',
          '720p': 'https://cdn.example/720.mp4',
          '1080p': 'https://cdn.example/1080.mp4',
        },
      }),
    ).toBe('https://cdn.example/1080.mp4');
  });

  it('orders 720p above 480p when 1080p is missing', () => {
    expect(
      selectPlaybackSource({
        video_urls: {
          '480p': 'https://cdn.example/480.mp4',
          '720p': 'https://cdn.example/720.mp4',
        },
      }),
    ).toBe('https://cdn.example/720.mp4');
  });

  it('ignores renditions above 1080p', () => {
    expect(
      selectPlaybackSource({
        video_url: ORIGINAL,
        video_urls: { '2160p': 'https://cdn.example/2160.mp4' },
      }),
    ).toBe(ORIGINAL);
  });

  it('falls back to the original when `video_urls` is an empty object', () => {
    expect(selectPlaybackSource({ video_url: ORIGINAL, video_urls: {}, src: SRC })).toBe(ORIGINAL);
  });

  it('falls back to the original when `video_urls` is undefined', () => {
    expect(selectPlaybackSource({ video_url: ORIGINAL, src: SRC })).toBe(ORIGINAL);
  });

  it('falls back to `src` when there is no original either', () => {
    expect(selectPlaybackSource({ video_urls: {}, src: SRC })).toBe(SRC);
    expect(selectPlaybackSource({ src: SRC })).toBe(SRC);
  });

  it('treats blank strings as absent', () => {
    expect(
      selectPlaybackSource({ video_url: '', video_urls: { '720p': '   ' }, src: SRC }),
    ).toBe(SRC);
  });

  it('returns an empty string when there is nothing to play', () => {
    expect(selectPlaybackSource({})).toBe('');
  });
});
