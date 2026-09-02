import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  fetchHiddenActivityItems,
  hideActivityItem,
  unhideActivityItem,
} from './activity-items-hide.js';
import type { ActivityItem } from './activity.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('hideActivityItem', () => {
  it('POSTs the uri and collection', async () => {
    const fetchImpl = jsonFetch({ ok: true });

    await hideActivityItem(
      { ...baseConfig, fetch: fetchImpl },
      { uri: 'at://did:plc:a/app.bsky.feed.post/1', collection: 'app.bsky.feed.post' },
    );

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity/items/hide');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      uri: 'at://did:plc:a/app.bsky.feed.post/1',
      collection: 'app.bsky.feed.post',
    });
  });

  it('passes the day bucket through when the caller supplies one', async () => {
    const fetchImpl = jsonFetch({ ok: true });

    await hideActivityItem(
      { ...baseConfig, fetch: fetchImpl },
      {
        uri: 'at://did:plc:a/app.bsky.feed.post/1',
        collection: 'app.bsky.feed.post',
        appId: 'bluesky',
        activityDate: '2026-08-01',
      },
    );

    const [, init] = getCall(fetchImpl);
    expect(JSON.parse(init.body as string)).toMatchObject({
      appId: 'bluesky',
      activityDate: '2026-08-01',
    });
  });

  it('reports failure rather than throwing', async () => {
    const fetchImpl = jsonFetch({ error: 'Unauthorized' }, 401);

    const result = await hideActivityItem(
      { ...baseConfig, fetch: fetchImpl },
      { uri: 'at://x', collection: 'c' },
    );

    expect(result.success).toBe(false);
  });
});

describe('unhideActivityItem', () => {
  it('DELETEs with only the uri', async () => {
    const fetchImpl = jsonFetch({ ok: true });

    await unhideActivityItem({ ...baseConfig, fetch: fetchImpl }, { uri: 'at://x' });

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity/items/hide');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ uri: 'at://x' });
  });
});

describe('fetchHiddenActivityItems', () => {
  it('unwraps the items array', async () => {
    const fetchImpl = jsonFetch({
      items: [
        {
          uri: 'at://x',
          collection: 'app.bsky.feed.post',
          appId: 'bluesky',
          activityDate: '2026-08-01',
          hiddenAt: '2026-08-02T00:00:00.000Z',
        },
      ],
    });

    const items = await fetchHiddenActivityItems({ ...baseConfig, fetch: fetchImpl });

    expect(items).toHaveLength(1);
    expect(items[0]?.uri).toBe('at://x');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity/hidden-items');
  });

  it('returns an empty list on error so a settings page still renders', async () => {
    const fetchImpl = jsonFetch({ error: 'Unauthorized' }, 401);

    expect(await fetchHiddenActivityItems({ ...baseConfig, fetch: fetchImpl })).toEqual([]);
  });

  it('forwards the cookie header for RSC calls', async () => {
    const fetchImpl = jsonFetch({ items: [] });

    await fetchHiddenActivityItems(
      { ...baseConfig, fetch: fetchImpl },
      {
        cookieHeader: 'session=abc',
      },
    );

    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('ActivityItem.hidden', () => {
  it('is optional, so existing responses stay valid', () => {
    const item: ActivityItem = {
      uri: 'at://x',
      cid: '',
      collection: 'app.bsky.feed.post',
      rkey: 'r',
      record: {},
      appId: 'bluesky',
      appName: 'Bluesky',
      category: 'Posts',
      indexedAt: '2026-08-01T00:00:00.000Z',
    };
    expect(item.hidden).toBeUndefined();
    expect({ ...item, hidden: true }.hidden).toBe(true);
  });
});
