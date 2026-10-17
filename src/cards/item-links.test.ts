import { describe, expect, it } from 'vitest';

import { appLinksItems } from './item-links.js';
import { resolveCardHealth } from './resolve-card-url.js';

const base = { rkey: '3k', authorDid: 'did:plc:abc', authorHandle: 'alice.test' };

describe('resolveCardHealth profile fallback', () => {
  it('marks a profile-only link (Passports) as a profile fallback', () => {
    const h = resolveCardHealth({
      ...base,
      uri: 'at://did:plc:abc/social.passports.travel.leg/3k',
      collection: 'social.passports.travel.leg',
      record: {},
    });
    expect(h.url).toBe('https://passports.social/profile/alice.test');
    expect(h.isProfileFallback).toBe(true);
  });

  it('gives a Collective Social list no link to the item', () => {
    const h = resolveCardHealth({
      ...base,
      uri: 'at://did:plc:abc/app.collectivesocial.feed.list/3k',
      collection: 'app.collectivesocial.feed.list',
      record: {},
    });
    expect(h.url).toBeNull();
  });

  it('does not mark a per-item link', () => {
    const h = resolveCardHealth({
      ...base,
      uri: 'at://did:plc:abc/app.bsky.feed.post/3k',
      collection: 'app.bsky.feed.post',
      record: { text: 'hi' },
    });
    expect(h.url).toContain('/post/3k');
    expect(h.isProfileFallback).toBeUndefined();
  });

  it('marks the Tangled profile-by-DID fallback', () => {
    const h = resolveCardHealth({
      ...base,
      authorHandle: undefined,
      uri: 'at://did:plc:abc/sh.tangled.graph.follow/3k',
      collection: 'sh.tangled.graph.follow',
      record: {},
    });
    expect(h.isProfileFallback).toBe(true);
  });
});

describe('appLinksItems', () => {
  it('is false for apps that can only link a profile, a homepage, or nothing', () => {
    expect(appLinksItems('passports')).toBe(false);
    expect(appLinksItems('collectivesocial')).toBe(false);
    expect(appLinksItems('pixl')).toBe(false);
  });

  it('is true for apps that link items another way (record URL, own transform)', () => {
    expect(appLinksItems('fediverse')).toBe(true);
    expect(appLinksItems('github')).toBe(true);
    expect(appLinksItems('hyperboards')).toBe(true);
  });

  it('is true for apps with a per-item pattern or their own item resolver', () => {
    expect(appLinksItems('bluesky')).toBe(true);
    expect(appLinksItems('tangled')).toBe(true);
    expect(appLinksItems('userinput')).toBe(true);
    expect(appLinksItems('standard')).toBe(true);
  });
});
