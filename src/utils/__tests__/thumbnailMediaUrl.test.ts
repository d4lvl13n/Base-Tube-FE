import { thumbnailMediaUrl } from '../thumbnailMediaUrl';

const root = 'https://gateway.storjshare.io/basetube-thumbnails/';
const signed = '44b09eac-fe8b-4b9a-ac9c-f53f27904f0d.png?X-Amz-Credential=test%2F20260909%2Fs3&X-Amz-Signature=abc&x-id=GetObject';

it('routes signed thumbnail delivery through the app without changing the signature query', () => {
  expect(thumbnailMediaUrl(root + signed)).toBe('/thumbnail-media/' + signed);
});

it.each([
  'https://gateway.storjshare.io/basetube-videos/' + signed,
  'https://gateway.storjshare.io.evil.example/basetube-thumbnails/' + signed,
  root + '../basetube-videos/' + signed,
  root + 'image.svg?signature=abc',
  root + '%2e%2e%2fimage.png?signature=abc',
  'https://example.com/image.png', 'blob:test', 'data:image/png;base64,test', '',
  '/thumbnail-media/' + signed,
])('leaves other image sources unchanged: %s', source => {
  expect(thumbnailMediaUrl(source)).toBe(source);
});
