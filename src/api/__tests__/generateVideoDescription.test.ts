import { generateVideoDescription } from '../video';
import type { GenerateVideoDescriptionResponse } from '../video';
import api from '../index';

jest.mock('../index', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = (api as unknown as { get: jest.Mock }).get;

/** The query string the call actually put on the wire, parsed back out. */
function sentParams(): URLSearchParams {
  const url = mockedGet.mock.calls[0][0] as string;
  return new URLSearchParams(url.slice(url.indexOf('?') + 1));
}

const RESPONSE: GenerateVideoDescriptionResponse = {
  description: 'Hook line.\n\nA paragraph.\n\n• A bullet\n• Another bullet\n\nSubscribe.\n\n#base #tube',
  suggestedTitle: 'A Much Better Title',
  keywords: ['base', 'tube', 'web3'],
  hashtags: ['#base', '#tube'],
};

describe('generateVideoDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue({ data: RESPONSE });
  });

  it('sends every context field the upload page can supply', async () => {
    await generateVideoDescription({
      title: 'My clip',
      keywords: 'base, tube',
      additionalInfo: 'Shot on a phone',
      channelName: 'Damien Builds',
      channelDescription: 'Weekly web3 build logs',
      durationSeconds: 613.7,
      existingDescription: 'A rough draft.\n\n• with a bullet',
      tags: 'web3,base',
      language: 'en-GB',
    });

    const params = sentParams();
    expect(mockedGet.mock.calls[0][0]).toContain('/api/v1/videos/description?');
    expect(params.get('title')).toBe('My clip');
    expect(params.get('keywords')).toBe('base, tube');
    expect(params.get('additionalInfo')).toBe('Shot on a phone');
    expect(params.get('channelName')).toBe('Damien Builds');
    expect(params.get('channelDescription')).toBe('Weekly web3 build logs');
    expect(params.get('existingDescription')).toBe('A rough draft.\n\n• with a bullet');
    expect(params.get('tags')).toBe('web3,base');
    expect(params.get('language')).toBe('en-GB');
    // Rounded, because the contract is whole seconds.
    expect(params.get('durationSeconds')).toBe('614');
  });

  it('omits blank and meaningless optional params instead of sending empties', async () => {
    await generateVideoDescription({
      title: 'My clip',
      keywords: '',
      additionalInfo: '   ',
      existingDescription: '',
      durationSeconds: 0,
    });

    const keys: string[] = [];
    sentParams().forEach((_value, key) => keys.push(key));
    expect(keys).toEqual(['title']);
  });

  it('drops a NaN duration rather than sending "NaN"', async () => {
    await generateVideoDescription({ title: 'My clip', durationSeconds: Number.NaN });

    expect(sentParams().has('durationSeconds')).toBe(false);
  });

  it('still accepts the original positional signature', async () => {
    await generateVideoDescription('My clip', 'base,tube', 'more context');

    const params = sentParams();
    expect(params.get('title')).toBe('My clip');
    expect(params.get('keywords')).toBe('base,tube');
    expect(params.get('additionalInfo')).toBe('more context');
    expect(params.has('language')).toBe(false);
  });

  it('returns the structured payload, line breaks intact', async () => {
    const result = await generateVideoDescription({ title: 'My clip' });

    // Typed: these three lines would not compile if the response type lost the
    // new fields, and the runtime assertions prove they are passed through.
    const hashtags: string[] = result.hashtags ?? [];
    const keywords: string[] = result.keywords ?? [];
    const description: string = result.description;

    expect(description).toContain('\n\n');
    expect(description).toContain('• A bullet');
    expect(hashtags).toEqual(['#base', '#tube']);
    expect(keywords).toEqual(['base', 'tube', 'web3']);
    expect(result.suggestedTitle).toBe('A Much Better Title');
  });

  it('caps runaway free text so the GET cannot blow the URL limit', async () => {
    await generateVideoDescription({
      title: 'My clip',
      existingDescription: 'x'.repeat(9000),
    });

    expect(sentParams().get('existingDescription')).toHaveLength(2000);
  });
});
