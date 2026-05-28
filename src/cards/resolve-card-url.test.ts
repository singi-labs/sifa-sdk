import { describe, expect, it } from 'vitest';

import { getAppIdForCollection, resolveCardUrl } from './resolve-card-url.js';

// All test inputs mirror the exact shapes the sifa-web activity-card
// components consume today. Each case asserts the URL that the card
// renders, so the scanner can ask "given this item, what URL would
// the UI link to?" with no UI-side assumptions.

describe('getAppIdForCollection', () => {
  it('maps known collection prefixes to app ids', () => {
    expect(getAppIdForCollection('sh.tangled.graph.repo')).toBe('tangled');
    expect(getAppIdForCollection('com.whtwnd.blog.entry')).toBe('whitewind');
    expect(getAppIdForCollection('fyi.unravel.frontpage.post')).toBe('frontpage');
    expect(getAppIdForCollection('community.lexicon.calendar.event')).toBe('smokesignal');
    expect(getAppIdForCollection('community.lexicon.calendar.rsvp')).toBe('smokesignal');
    expect(getAppIdForCollection('community.lexicon.bookmarks.bookmark')).toBe('kipclip');
    expect(getAppIdForCollection('com.kipclip.bookmark')).toBe('kipclip');
    expect(getAppIdForCollection('at.margin.bookmark')).toBe('margin');
    expect(getAppIdForCollection('at.margin.annotation')).toBe('margin');
    expect(getAppIdForCollection('buzz.bookhive.book')).toBe('bookhive');
    expect(getAppIdForCollection('social.grain.gallery')).toBe('grain');
    expect(getAppIdForCollection('link.pastesphere.snippet')).toBe('pastesphere');
    expect(getAppIdForCollection('site.standard.document')).toBe('standard');
    expect(getAppIdForCollection('place.stream.livestream')).toBe('streamplace');
    expect(getAppIdForCollection('app.bsky.feed.post')).toBe('bluesky');
  });

  it('falls back to the first two NSID segments for unknown apps', () => {
    expect(getAppIdForCollection('org.hyperboards.board')).toBe('org.hyperboards');
    expect(getAppIdForCollection('io.kich.recipe.dish')).toBe('io.kich');
  });

  it('returns the input when the NSID has fewer than two segments', () => {
    expect(getAppIdForCollection('unknown')).toBe('unknown');
  });
});

describe('resolveCardUrl', () => {
  const baseItem = {
    uri: 'at://did:plc:abc/sh.tangled.graph.repo/3kxyz',
    rkey: '3kxyz',
    authorDid: 'did:plc:abc',
    authorHandle: 'alice.test',
  };

  describe('tangled', () => {
    it('returns the per-repo URL when record.name is present and handle is known', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: { name: 'my-repo' },
        }),
      ).toBe('https://tangled.sh/alice.test/my-repo');
    });

    it('falls back to the tangled profile URL when record.name is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: {},
        }),
      ).toBe('https://tangled.sh/alice.test');
    });

    it('returns null when neither per-item nor profile URL can be built', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: {},
          authorHandle: undefined,
        }),
      ).toBeNull();
    });
  });

  describe('kipclip / community.lexicon.bookmarks', () => {
    it('returns record.subject (the bookmarked URL) as the per-item URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'com.kipclip.bookmark',
          record: { subject: 'https://example.com/article' },
        }),
      ).toBe('https://example.com/article');
    });

    it('falls back to the kipclip profile URL when subject is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'community.lexicon.bookmarks.bookmark',
          record: {},
        }),
      ).toBe('https://kipclip.com/alice.test');
    });
  });

  describe('margin bookmark', () => {
    it('returns record.source as the per-item URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.bookmark',
          record: { source: 'https://example.com/page' },
        }),
      ).toBe('https://example.com/page');
    });

    it('returns null when source is missing (card itself renders nothing)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.bookmark',
          record: {},
        }),
      ).toBeNull();
    });
  });

  describe('margin annotation', () => {
    it('returns record.target.source as the per-item URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.annotation',
          record: { target: { source: 'https://example.com/article' }, body: 'note' },
        }),
      ).toBe('https://example.com/article');
    });

    it('falls back to the margin app URL when target.source is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.annotation',
          record: { body: 'note' },
        }),
      ).toBe('https://margin.at');
    });
  });

  describe('smokesignal rsvp', () => {
    it('parses record.subject.uri into the smokesignal event URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'community.lexicon.calendar.rsvp',
          record: {
            subject: { uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc' },
            status: 'community.lexicon.calendar.rsvp#going',
          },
        }),
      ).toBe('https://smokesignal.events/did:plc:eventowner/3k1abc');
    });

    it('returns null when the subject uri is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'community.lexicon.calendar.rsvp',
          record: { status: 'going' },
        }),
      ).toBeNull();
    });
  });

  describe('smokesignal event', () => {
    it('builds the per-event URL from the item uri', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc',
          rkey: '3k1abc',
          authorDid: 'did:plc:eventowner',
          collection: 'community.lexicon.calendar.event',
          record: { name: 'Conf' },
        }),
      ).toBe('https://smokesignal.events/did:plc:eventowner/3k1abc');
    });
  });

  describe('standard documents (generic-card siteUrl path)', () => {
    it('joins siteUrl and path when both are present', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'site.standard.document',
          record: {
            siteUrl: 'https://example.com',
            path: '/posts/hello',
          },
        }),
      ).toBe('https://example.com/posts/hello');
    });

    it('returns just siteUrl when path is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'site.standard.document',
          record: { siteUrl: 'https://example.com' },
        }),
      ).toBe('https://example.com');
    });
  });

  describe('generic record.url fallback', () => {
    it('uses record.url when present and no app-specific rule fires', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'org.hyperboards.board',
          record: { url: 'https://hyperboards.example/board/1' },
        }),
      ).toBe('https://hyperboards.example/board/1');
    });
  });

  describe('pattern-based fallbacks (whitewind / frontpage / pastesphere / etc.)', () => {
    it('whitewind: handle + rkey pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:abc/com.whtwnd.blog.entry/3kentry',
          rkey: '3kentry',
          collection: 'com.whtwnd.blog.entry',
          record: {},
        }),
      ).toBe('https://whtwnd.com/alice.test/3kentry');
    });

    it('frontpage: did + rkey pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:abc/fyi.unravel.frontpage.post/3kpost',
          rkey: '3kpost',
          collection: 'fyi.unravel.frontpage.post',
          record: {},
        }),
      ).toBe('https://frontpage.fyi/post/did%3Aplc%3Aabc/3kpost');
    });

    it('pastesphere: handle + rkey', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'link.pastesphere.snippet',
          rkey: '3ksnip',
          record: {},
        }),
      ).toBe('https://pastesphere.link/user/alice.test/snippet/3ksnip');
    });

    it('grain: did + rkey gallery pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'social.grain.gallery',
          uri: 'at://did:plc:abc/social.grain.gallery/3kgal',
          rkey: '3kgal',
          record: {},
        }),
      ).toBe('https://grain.social/profile/did%3Aplc%3Aabc/gallery/3kgal');
    });

    it('bookhive: handle profile fallback (no per-item URL)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'buzz.bookhive.book',
          record: {},
        }),
      ).toBe('https://bookhive.buzz/profile/alice.test');
    });
  });

  describe('tangled slug validation (regression: sifa-web#1071/#1072)', () => {
    it('falls back to profile URL when record.name contains whitespace', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: { name: 'atproto-snake azurite othername' },
        }),
      ).toBe('https://tangled.sh/alice.test');
    });

    it('falls back to profile URL when record.name contains a slash', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: { name: 'foo/bar' },
        }),
      ).toBe('https://tangled.sh/alice.test');
    });

    it('falls back to profile URL when record.name has URL-encodable chars', () => {
      for (const bad of ['foo?bar', 'foo#bar', 'foo%20bar']) {
        expect(
          resolveCardUrl({
            ...baseItem,
            collection: 'sh.tangled.graph.repo',
            record: { name: bad },
          }),
        ).toBe('https://tangled.sh/alice.test');
      }
    });

    it('accepts valid slugs with dots, dashes, and underscores', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.graph.repo',
          record: { name: 'my.repo_name-1' },
        }),
      ).toBe('https://tangled.sh/alice.test/my.repo_name-1');
    });
  });

  describe('bluesky collection-aware URLs (regression: sifa-web#1070/#1073)', () => {
    const blueskyBase = {
      uri: 'at://did:plc:abc/app.bsky.feed.post/3kpost',
      rkey: '3kpost',
      authorDid: 'did:plc:abc',
      authorHandle: 'alice.test',
    };

    it('emits per-post URL for app.bsky.feed.post', () => {
      expect(
        resolveCardUrl({
          ...blueskyBase,
          collection: 'app.bsky.feed.post',
          record: {},
        }),
      ).toBe('https://bsky.app/profile/alice.test/post/3kpost');
    });

    it('falls back to profile URL for app.bsky.actor.status (rkey=self would 404)', () => {
      const url = resolveCardUrl({
        ...blueskyBase,
        collection: 'app.bsky.actor.status',
        rkey: 'self',
        record: {},
      });
      expect(url).toBe('https://bsky.app/profile/alice.test');
      expect(url).not.toContain('/post/');
    });

    it('falls back to profile URL for app.bsky.graph.cancellation', () => {
      const url = resolveCardUrl({
        ...blueskyBase,
        collection: 'app.bsky.graph.cancellation',
        rkey: '3mbfqik7dy42s',
        record: {},
      });
      expect(url).toBe('https://bsky.app/profile/alice.test');
      expect(url).not.toContain('/post/');
    });

    it('falls back to profile URL for every non-feed.post app.bsky.* collection', () => {
      const collections = [
        'app.bsky.feed.generator',
        'app.bsky.graph.list',
        'app.bsky.actor.profile',
        'app.bsky.graph.starterpack',
        'app.bsky.feed.like',
        'app.bsky.graph.follow',
      ];
      for (const collection of collections) {
        const url = resolveCardUrl({ ...blueskyBase, collection, record: {} });
        expect(url, `should not emit /post/ for ${collection}`).toBe(
          'https://bsky.app/profile/alice.test',
        );
      }
    });

    it('reproduces the 3 broken URLs from sifa-web#1070 and confirms they no longer 404', () => {
      const cases = [
        {
          collection: 'app.bsky.graph.cancellation',
          authorHandle: 'eti.tf',
          rkey: '3mbfqik7dy42s',
          shouldNotMatch: 'https://bsky.app/profile/eti.tf/post/3mbfqik7dy42s',
        },
        {
          collection: 'app.bsky.actor.status',
          authorHandle: 'harry.eurosky.social',
          rkey: 'self',
          shouldNotMatch: 'https://bsky.app/profile/harry.eurosky.social/post/self',
        },
        {
          collection: 'app.bsky.actor.status',
          authorHandle: 'roelworp.nl',
          rkey: 'self',
          shouldNotMatch: 'https://bsky.app/profile/roelworp.nl/post/self',
        },
      ];
      for (const c of cases) {
        const url = resolveCardUrl({
          collection: c.collection,
          authorHandle: c.authorHandle,
          rkey: c.rkey,
          uri: `at://did:plc:x/${c.collection}/${c.rkey}`,
          authorDid: 'did:plc:x',
          record: {},
        });
        expect(url).not.toBe(c.shouldNotMatch);
      }
    });
  });

  describe('unsupported / unclickable collections', () => {
    it('returns null for picosky (no URL pattern registered)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'social.psky.feed.post',
          record: {},
        }),
      ).toBeNull();
    });

    it('returns null for unknown app prefixes with no registered patterns', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'com.example.unknown.thing',
          record: {},
        }),
      ).toBeNull();
    });
  });
});
