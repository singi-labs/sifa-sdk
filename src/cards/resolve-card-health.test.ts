import { describe, expect, it } from 'vitest';

import { resolveCardHealth, resolveCardUrl } from './resolve-card-url.js';

// resolveCardHealth returns BOTH the clickable URL (identical to
// resolveCardUrl) and a health-check strategy:
//
//   'record' -- the URL is a first-party permalink rendering THIS record;
//               the correct liveness check is "does the record still exist
//               on its PDS" (getRecord on the item's own at-uri), NOT an
//               HTTP probe of the rendering app (bsky.app, tangled.sh, ...)
//               which may not answer HEAD and would false-positive.
//   'url'    -- the URL is a foreign/derived target (a bookmarked page, an
//               external publisher, a *different* record's page, or a
//               profile page). Check URL reachability as before.
//   'none'   -- no clickable URL; nothing to check.

describe('resolveCardHealth', () => {
  const base = {
    uri: 'at://did:plc:abc/app.bsky.feed.post/3kpost',
    rkey: '3kpost',
    authorDid: 'did:plc:abc',
    authorHandle: 'alice.test',
  };

  it('url matches resolveCardUrl for the same item', () => {
    const item = { ...base, collection: 'app.bsky.feed.post', record: {} };
    expect(resolveCardHealth(item).url).toBe(resolveCardUrl(item));
  });

  describe("record strategy (self-permalink: check the record's existence)", () => {
    it('app.bsky.feed.post -> record (the reported bug: bsky.app 404s HEAD)', () => {
      const h = resolveCardHealth({ ...base, collection: 'app.bsky.feed.post', record: {} });
      expect(h.strategy).toBe('record');
      expect(h.url).toBe('https://bsky.app/profile/alice.test/post/3kpost');
    });

    it('whitewind blog entry (per-item pattern) -> record', () => {
      const h = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:abc/com.whtwnd.blog.entry/3kentry',
        rkey: '3kentry',
        collection: 'com.whtwnd.blog.entry',
        record: {},
      });
      expect(h.strategy).toBe('record');
    });

    it('frontpage / pastesphere / leaflet / spark / anisota / grain / asq-question -> record', () => {
      const cases: Array<[string, string]> = [
        ['fyi.unravel.frontpage.post', '3kpost'],
        ['link.pastesphere.snippet', '3ksnip'],
        ['pub.leaflet.document', '3kdoc'],
        ['so.sprk.post', '3kspark'],
        ['net.anisota.post', '3kani'],
        ['social.grain.gallery', '3kgal'],
        ['fyi.asq.question', '3kq'],
      ];
      for (const [collection, rkey] of cases) {
        const h = resolveCardHealth({
          ...base,
          uri: `at://did:plc:abc/${collection}/${rkey}`,
          rkey,
          collection,
          record: {},
        });
        expect(h.strategy, `${collection} should be record-checked`).toBe('record');
      }
    });

    it('community-calendar event (own uri) -> record on atmo.rsvp', () => {
      const h = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc',
        rkey: '3k1abc',
        authorDid: 'did:plc:eventowner',
        collection: 'community.lexicon.calendar.event',
        record: { name: 'Conf' },
      });
      expect(h.strategy).toBe('record');
      expect(h.url).toBe('https://atmo.rsvp/p/did:plc:eventowner/e/3k1abc');
    });

    it('atmo.rsvp event (own uri) -> record', () => {
      const h = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:eventowner/quest.atmo.event/3mmwfrca77o25',
        rkey: '3mmwfrca77o25',
        authorDid: 'did:plc:eventowner',
        collection: 'quest.atmo.event',
        record: { name: 'Test Event' },
      });
      expect(h.strategy).toBe('record');
    });

    it('tangled per-repo URL -> record', () => {
      const h = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:abc/sh.tangled.graph.repo/3kxyz',
        rkey: '3kxyz',
        collection: 'sh.tangled.graph.repo',
        record: { name: 'my-repo' },
      });
      expect(h.strategy).toBe('record');
      expect(h.url).toBe('https://tangled.sh/alice.test/my-repo');
    });

    it('kich / recipe.exchange recipe pages (first-party permalink) -> record', () => {
      const kich = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:abc/io.kich.recipe.recipe/3ml4zymkkx2do',
        rkey: '3ml4zymkkx2do',
        collection: 'io.kich.recipe.recipe',
        record: { name: 'Lemonade', url: 'https://youtube.com/watch?v=x' },
      });
      expect(kich.strategy).toBe('record');
      const recipe = resolveCardHealth({
        ...base,
        uri: 'at://did:plc:abc/exchange.recipe.recipe/01JGBGH49C2EH1564TNWZREANW',
        rkey: '01JGBGH49C2EH1564TNWZREANW',
        collection: 'exchange.recipe.recipe',
        record: { name: 'Popcorn', attribution: { url: 'https://moll.dev/x' } },
      });
      expect(recipe.strategy).toBe('record');
    });
  });

  describe('url strategy (foreign / derived / profile page: check reachability)', () => {
    it('kipclip bookmark subject (external URL) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'com.kipclip.bookmark',
        record: { subject: 'https://example.com/article' },
      });
      expect(h.strategy).toBe('url');
      expect(h.url).toBe('https://example.com/article');
    });

    it('margin annotation external source -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'at.margin.annotation',
        record: { target: { source: 'https://example.com/article' } },
      });
      expect(h.strategy).toBe('url');
    });

    it('crate content canonicalUrl (external) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'social.crate.content',
        record: { canonicalUrl: 'https://youtube.com/embed/x' },
      });
      expect(h.strategy).toBe('url');
    });

    it('standard.site document (external site) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'site.standard.document',
        record: { siteUrl: 'https://example.com', path: '/p/hello' },
      });
      expect(h.strategy).toBe('url');
    });

    it('generic record.url (hyperboards) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'org.hyperboards.board',
        record: { url: 'https://hyperboards.example/board/1' },
      });
      expect(h.strategy).toBe('url');
    });

    it('smokesignal rsvp points at a DIFFERENT record (event) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'community.lexicon.calendar.rsvp',
        record: {
          subject: { uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc' },
        },
      });
      expect(h.strategy).toBe('url');
    });

    it('atmo checkin points at a DIFFERENT record (event) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'quest.atmo.checkin',
        record: { event: 'at://did:plc:eventowner/quest.atmo.event/3mmwfrca77o25' },
      });
      expect(h.strategy).toBe('url');
    });

    it('atstore review deep-links to product page -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'fyi.atstore.listing.review',
        record: { listingMeta: { slug: 'graze' } },
      });
      expect(h.strategy).toBe('url');
    });

    it('bluesky non-post collection falls back to PROFILE page -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'app.bsky.actor.status',
        rkey: 'self',
        record: {},
      });
      expect(h.strategy).toBe('url');
      expect(h.url).toBe('https://bsky.app/profile/alice.test');
    });

    it('bookhive (profile-only pattern) -> url', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'buzz.bookhive.book',
        record: {},
      });
      expect(h.strategy).toBe('url');
      expect(h.url).toBe('https://bookhive.buzz/profile/alice.test');
    });
  });

  describe('none strategy (no clickable URL)', () => {
    it('margin bookmark without source -> none', () => {
      const h = resolveCardHealth({ ...base, collection: 'at.margin.bookmark', record: {} });
      expect(h.strategy).toBe('none');
      expect(h.url).toBeNull();
    });

    it('crate note (no public viewer) -> none', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'social.crate.note',
        record: { title: 'x' },
      });
      expect(h.strategy).toBe('none');
    });

    it('picosky (no pattern) -> none', () => {
      const h = resolveCardHealth({
        ...base,
        collection: 'social.psky.feed.post',
        record: {},
      });
      expect(h.strategy).toBe('none');
    });
  });
});
