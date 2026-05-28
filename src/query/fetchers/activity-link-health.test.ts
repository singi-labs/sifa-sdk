import { describe, it, expectTypeOf } from 'vitest';
import type { ActivityItem, ActivityItemLinkHealth } from './activity.js';

describe('ActivityItem.linkHealth', () => {
  it('exports the ActivityItemLinkHealth union with the expected members', () => {
    expectTypeOf<ActivityItemLinkHealth>().toEqualTypeOf<
      'ok' | 'broken' | 'unverifiable' | 'unknown'
    >();
  });

  it('accepts an ActivityItem without linkHealth (backward compatible)', () => {
    const item: ActivityItem = {
      uri: 'at://did:plc:abc/app.bsky.feed.post/1',
      cid: 'bafy',
      collection: 'app.bsky.feed.post',
      rkey: '1',
      record: { text: 'hi' },
      appId: 'bluesky',
      appName: 'Bluesky',
      category: 'social',
      indexedAt: '2026-05-28T00:00:00Z',
    };
    expectTypeOf(item.linkHealth).toEqualTypeOf<ActivityItemLinkHealth | undefined>();
  });

  it('accepts each ActivityItemLinkHealth value', () => {
    const base = {
      uri: 'at://x',
      cid: '',
      collection: 'c',
      rkey: 'r',
      record: {},
      appId: 'a',
      appName: 'A',
      category: 'c',
      indexedAt: '2026-05-28T00:00:00Z',
    };
    const ok: ActivityItem = { ...base, linkHealth: 'ok' };
    const broken: ActivityItem = { ...base, linkHealth: 'broken' };
    const unverifiable: ActivityItem = { ...base, linkHealth: 'unverifiable' };
    const unknown: ActivityItem = { ...base, linkHealth: 'unknown' };
    expectTypeOf(ok.linkHealth).toEqualTypeOf<ActivityItemLinkHealth | undefined>();
    expectTypeOf(broken.linkHealth).toEqualTypeOf<ActivityItemLinkHealth | undefined>();
    expectTypeOf(unverifiable.linkHealth).toEqualTypeOf<ActivityItemLinkHealth | undefined>();
    expectTypeOf(unknown.linkHealth).toEqualTypeOf<ActivityItemLinkHealth | undefined>();
  });
});
