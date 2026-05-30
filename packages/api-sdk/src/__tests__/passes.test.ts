import { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient } from '../index';

function makeAdapter(handler: (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }) {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const r = handler(config);
    const response: AxiosResponse = { data: r.data, status: r.status, statusText: '', headers: {}, config };
    return response;
  };
  return { adapter, requests };
}

describe('passes / access / purchases', () => {
  it('getById accepts a raw pass payload (no envelope)', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { id: 'p1', title: 'Pass', videos: [] } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.passes.getById('p1')).resolves.toMatchObject({ id: 'p1', title: 'Pass' });
  });

  it('getById unwraps a { success, data } envelope', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: { id: 'p2', title: 'Wrapped' } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.passes.getById('p2')).resolves.toMatchObject({ id: 'p2', title: 'Wrapped' });
  });

  it('discover sends limit/offset + filters', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { data: [], pagination: { total: 0, limit: 24, offset: 0 } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await client.passes.discover({ search: 'art', tier: 'gold' });
    expect(requests[0].url).toBe('/api/v1/passes/discover');
    expect(requests[0].params).toMatchObject({ limit: 24, offset: 0, search: 'art', tier: 'gold' });
  });

  it('signedUrl unwraps data.signed_url', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: { signed_url: 'https://cdn/x.m3u8' } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.passes.signedUrl('v1')).resolves.toBe('https://cdn/x.m3u8');
  });

  it('access.get reads data envelope', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: { passId: 'p1', hasAccess: true } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    const res = await client.access.get('p1');
    expect(requests[0].params).toMatchObject({ passId: 'p1' });
    expect(res.hasAccess).toBe(true);
  });

  it('purchases.pending unwraps data.purchases', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: { purchases: [{ purchaseId: 'x', passId: 'p', status: 'pending' }] } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.purchases.pending()).resolves.toHaveLength(1);
  });
});
