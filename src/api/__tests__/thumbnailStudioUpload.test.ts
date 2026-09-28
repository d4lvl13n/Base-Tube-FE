import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api from '../index';
import { thumbnailStudioApi } from '../thumbnailStudio';

describe('Studio upload request', () => {
  const original = api.defaults.adapter;
  afterEach(() => { api.defaults.adapter = original; });

  it('sends a multipart form with exactly purpose then file, never JSON', async () => {
    const seen: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      seen.push(config);
      return { data: { success: true, data: { id: 'asset' } }, status: 201, statusText: 'Created', headers: {}, config } as AxiosResponse;
    }) as AxiosAdapter;
    const file = new File(['WEBVTT'], 'talk.vtt', { type: 'text/vtt' });
    await expect(thumbnailStudioApi.upload(file, 'script')).resolves.toEqual({ id: 'asset' });
    const [config] = seen;
    expect(`${config.method} ${config.url}`).toBe('post /api/v1/thumbnail-studio/assets');
    // The shared client defaults to application/json, which would serialise the form as {"file":{},…}.
    expect(config.data).toBeInstanceOf(FormData);
    const form = config.data as FormData;
    expect(Array.from(form.keys())).toEqual(['purpose', 'file']);
    expect(form.get('purpose')).toBe('script');
    expect((form.get('file') as File).name).toBe('talk.vtt');
    expect(String(config.headers.getContentType())).toContain('multipart/form-data');
  });
});
