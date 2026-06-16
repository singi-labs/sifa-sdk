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

    it('uses the rkey as the repo slug for sh.tangled.repo when record.name is missing (new format)', () => {
      // Tangled's newer repo records omit `name` and use the slug as the rkey.
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:abc/sh.tangled.repo/bsky-avatar',
          rkey: 'bsky-avatar',
          collection: 'sh.tangled.repo',
          record: { knot: 'knot1.tangled.sh', description: 'Dynamic avatar rotation' },
        }),
      ).toBe('https://tangled.sh/alice.test/bsky-avatar');
    });

    it('does not use the rkey as a repo slug for non-repo tangled collections', () => {
      // A feed.star rkey is a TID, not a repo slug — building /{handle}/{rkey}
      // would 404, so fall back to the profile URL.
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'sh.tangled.feed.star',
          record: {},
        }),
      ).toBe('https://tangled.sh/alice.test');
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

  describe('atmo.rsvp event', () => {
    it('builds the per-event URL from the item uri', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:eventowner/quest.atmo.event/3mmwfrca77o25',
          rkey: '3mmwfrca77o25',
          authorDid: 'did:plc:eventowner',
          collection: 'quest.atmo.event',
          record: { name: 'Test Event' },
        }),
      ).toBe('https://atmo.rsvp/p/did:plc:eventowner/e/3mmwfrca77o25');
    });
  });

  describe('atmo.rsvp checkin', () => {
    it('parses record.event into the atmo.rsvp event URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'quest.atmo.checkin',
          record: {
            event: 'at://did:plc:eventowner/quest.atmo.event/3mmwfrca77o25',
            checkedInAt: '2026-05-31T14:56:30Z',
          },
        }),
      ).toBe('https://atmo.rsvp/p/did:plc:eventowner/e/3mmwfrca77o25');
    });

    it('returns null when the event reference is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'quest.atmo.checkin',
          record: { checkedInAt: '2026-05-31T14:56:30Z' },
        }),
      ).toBeNull();
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

    it('asq question: did + rkey pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'fyi.asq.question',
          uri: 'at://did:plc:abc/fyi.asq.question/3kq',
          rkey: '3kq',
          record: {},
        }),
      ).toBe('https://asq.fyi/q/did%3Aplc%3Aabc/3kq');
    });

    it('passports: handle profile fallback (no per-item URL)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'social.passports.travel.leg',
          record: {},
        }),
      ).toBe('https://passports.social/profile/alice.test');
    });

    it('leaflet document: rkey-only pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'pub.leaflet.document',
          uri: 'at://did:plc:abc/pub.leaflet.document/3mbfhk3bi2c2j',
          rkey: '3mbfhk3bi2c2j',
          record: {},
        }),
      ).toBe('https://leaflet.pub/3mbfhk3bi2c2j');
    });

    it('leaflet comment: rkey-only pattern (same shape as document)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'pub.leaflet.comment',
          uri: 'at://did:plc:abc/pub.leaflet.comment/3mmsrvz3rtc2d',
          rkey: '3mmsrvz3rtc2d',
          record: {},
        }),
      ).toBe('https://leaflet.pub/3mmsrvz3rtc2d');
    });
  });

  describe('getAppIdForCollection: newly added prefixes', () => {
    it('maps social.passports.* and fyi.asq.*', () => {
      expect(getAppIdForCollection('social.passports.travel.leg')).toBe('passports');
      expect(getAppIdForCollection('social.passports.fiftyStates.visit')).toBe('passports');
      expect(getAppIdForCollection('fyi.asq.question')).toBe('asq');
      expect(getAppIdForCollection('fyi.asq.answer')).toBe('asq');
    });

    it('maps pub.leaflet.* to leaflet', () => {
      expect(getAppIdForCollection('pub.leaflet.document')).toBe('leaflet');
      expect(getAppIdForCollection('pub.leaflet.comment')).toBe('leaflet');
    });

    it('maps quest.atmo.* to atmorsvp and community.opensocial.* to opensocial', () => {
      expect(getAppIdForCollection('quest.atmo.event')).toBe('atmorsvp');
      expect(getAppIdForCollection('quest.atmo.checkin')).toBe('atmorsvp');
      expect(getAppIdForCollection('community.opensocial.membership')).toBe('opensocial');
    });

    it('maps is.kevara.* to kevara', () => {
      expect(getAppIdForCollection('is.kevara.directory.speaker')).toBe('kevara');
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

  describe('atstore reviews', () => {
    const atstoreBase = {
      uri: 'at://did:plc:reviewer/fyi.atstore.listing.review/3kxyz',
      rkey: '3kxyz',
      authorDid: 'did:plc:reviewer',
      authorHandle: 'alice.test',
    };

    it('deep-links to the per-product page when listingMeta.slug is enriched', () => {
      expect(
        resolveCardUrl({
          ...atstoreBase,
          collection: 'fyi.atstore.listing.review',
          record: {
            text: 'great app',
            rating: 5,
            subject: 'at://did:plc:owner/fyi.atstore.listing.detail/3lmn',
            listingMeta: { slug: 'graze' },
          },
        }),
      ).toBe('https://atstore.fyi/products/graze');
    });

    it('falls back to https://atstore.fyi when listingMeta is missing', () => {
      expect(
        resolveCardUrl({
          ...atstoreBase,
          collection: 'fyi.atstore.listing.review',
          record: {
            text: 'great app',
            rating: 5,
            subject: 'at://did:plc:owner/fyi.atstore.listing.detail/3lmn',
          },
        }),
      ).toBe('https://atstore.fyi');
    });

    it('falls back to https://atstore.fyi when listingMeta.slug is empty', () => {
      expect(
        resolveCardUrl({
          ...atstoreBase,
          collection: 'fyi.atstore.listing.review',
          record: {
            listingMeta: { slug: '   ' },
          },
        }),
      ).toBe('https://atstore.fyi');
    });

    it('URI-encodes slugs that contain special characters', () => {
      expect(
        resolveCardUrl({
          ...atstoreBase,
          collection: 'fyi.atstore.listing.review',
          record: { listingMeta: { slug: 'my app/v2' } },
        }),
      ).toBe('https://atstore.fyi/products/my%20app%2Fv2');
    });

    it('never returns the legacy /@{handle} URL (regression: profile-page 404)', () => {
      const url = resolveCardUrl({
        ...atstoreBase,
        collection: 'fyi.atstore.listing.review',
        record: {},
      });
      expect(url).not.toContain('/@');
    });
  });

  describe('crate', () => {
    const crateBase = {
      uri: 'at://did:plc:maker/social.crate.content/3mmxmfhdhj52d',
      rkey: '3mmxmfhdhj52d',
      authorDid: 'did:plc:maker',
      authorHandle: 'brittany.test',
    };

    it('content: links to record.canonicalUrl (the published location)', () => {
      expect(
        resolveCardUrl({
          ...crateBase,
          collection: 'social.crate.content',
          record: {
            title: 'Ardan Labs Podcast',
            kind: 'podcast',
            canonicalUrl: 'https://www.youtube.com/embed/omXniEB22Js',
          },
        }),
      ).toBe('https://www.youtube.com/embed/omXniEB22Js');
    });

    it('content: returns null when canonicalUrl is missing (non-clickable)', () => {
      expect(
        resolveCardUrl({
          ...crateBase,
          collection: 'social.crate.content',
          record: { title: 'Untitled', kind: 'article' },
        }),
      ).toBeNull();
    });

    it('content: returns null when canonicalUrl is blank', () => {
      expect(
        resolveCardUrl({
          ...crateBase,
          collection: 'social.crate.content',
          record: { canonicalUrl: '   ' },
        }),
      ).toBeNull();
    });

    it('note: returns null — Crate has no public per-record viewer', () => {
      expect(
        resolveCardUrl({
          ...crateBase,
          uri: 'at://did:plc:maker/social.crate.note/3mloptefjc32q',
          rkey: '3mloptefjc32q',
          collection: 'social.crate.note',
          record: { title: 'Kubernetes', slug: 'kubernetes', body: '## Overview' },
        }),
      ).toBeNull();
    });

    it('getAppIdForCollection maps social.crate.* to crate', () => {
      expect(getAppIdForCollection('social.crate.content')).toBe('crate');
      expect(getAppIdForCollection('social.crate.note')).toBe('crate');
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
