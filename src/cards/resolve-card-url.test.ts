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
    expect(getAppIdForCollection('at.margin.note')).toBe('margin');
    expect(getAppIdForCollection('os.aether.docs.presentation')).toBe('aetherdocs');
    expect(getAppIdForCollection('io.kich.recipe.recipe')).toBe('kich');
    expect(getAppIdForCollection('exchange.recipe.recipe')).toBe('recipe');
    expect(getAppIdForCollection('buzz.bookhive.book')).toBe('bookhive');
    expect(getAppIdForCollection('social.grain.gallery')).toBe('grain');
    expect(getAppIdForCollection('pics.pixl.image')).toBe('pixl');
    expect(getAppIdForCollection('link.pastesphere.snippet')).toBe('pastesphere');
    expect(getAppIdForCollection('site.standard.document')).toBe('standard');
    expect(getAppIdForCollection('place.stream.livestream')).toBe('streamplace');
    expect(getAppIdForCollection('app.bsky.feed.post')).toBe('bluesky');
    expect(getAppIdForCollection('app.atmobb.discussion.reply')).toBe('atmobb');
    expect(getAppIdForCollection('app.atmobb.discussion.thread')).toBe('atmobb');
    expect(getAppIdForCollection('pub.chive.eprint.submission')).toBe('chive');
    expect(getAppIdForCollection('app.photosky.collection')).toBe('zeens');
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

  describe('margin note', () => {
    it('returns record.target.source (the annotated page) as the per-item URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.note',
          record: {
            target: { source: 'https://karlbode.com/article' },
            body: { value: 'a note', format: 'text/plain' },
          },
        }),
      ).toBe('https://karlbode.com/article');
    });

    it('falls back to the margin app URL when target.source is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'at.margin.note',
          record: { body: { value: 'a note' } },
        }),
      ).toBe('https://margin.at');
    });
  });

  describe('kich recipe', () => {
    it('links to the Kich recipe page by rkey, not record.url (import source)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'io.kich.recipe.recipe',
          uri: 'at://did:plc:abc/io.kich.recipe.recipe/3ml4zymkkx2do',
          rkey: '3ml4zymkkx2do',
          record: { name: 'Mountain Fog Lemonade', url: 'https://youtube.com/watch?v=x' },
        }),
      ).toBe('https://kich.io/recipes/3ml4zymkkx2do');
    });
  });

  describe('recipe.exchange recipe', () => {
    it('links to the recipe.exchange page by rkey, not attribution.url (source)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'exchange.recipe.recipe',
          uri: 'at://did:plc:abc/exchange.recipe.recipe/01JGBGH49C2EH1564TNWZREANW',
          rkey: '01JGBGH49C2EH1564TNWZREANW',
          record: {
            name: 'Stovetop Popcorn',
            attribution: { url: 'https://moll.dev/notes/popcorn-recipe/' },
          },
        }),
      ).toBe('https://recipe.exchange/recipes/01JGBGH49C2EH1564TNWZREANW');
    });
  });

  describe('aether docs presentation', () => {
    it('falls back to the author Aether OS space (no public per-record viewer)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'os.aether.docs.presentation',
          uri: 'at://did:plc:abc/os.aether.docs.presentation/3mgdzgxhr6k2r',
          rkey: '3mgdzgxhr6k2r',
          record: { title: 'The AT Protocol' },
        }),
      ).toBe('https://aetheros.computer/alice.test');
    });
  });

  describe('community-calendar rsvp', () => {
    it('parses record.subject.uri into the atmo.rsvp event URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'community.lexicon.calendar.rsvp',
          record: {
            subject: { uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc' },
            status: 'community.lexicon.calendar.rsvp#going',
          },
        }),
      ).toBe('https://atmo.rsvp/p/did:plc:eventowner/e/3k1abc');
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

  describe('community-calendar event', () => {
    it('builds the per-event atmo.rsvp URL from the item uri', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:eventowner/community.lexicon.calendar.event/3k1abc',
          rkey: '3k1abc',
          authorDid: 'did:plc:eventowner',
          collection: 'community.lexicon.calendar.event',
          record: { name: 'Conf' },
        }),
      ).toBe('https://atmo.rsvp/p/did:plc:eventowner/e/3k1abc');
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

  describe('dropanchor', () => {
    it('maps app.dropanchor.checkin to the dropanchor app', () => {
      expect(getAppIdForCollection('app.dropanchor.checkin')).toBe('dropanchor');
    });

    it('links a check-in to /checkin/{rkey} using its own rkey', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:abc/app.dropanchor.checkin/3mgzw2gt5uu23',
          rkey: '3mgzw2gt5uu23',
          collection: 'app.dropanchor.checkin',
          record: {
            text: 'Nice session!',
            address: { name: 'Revolt Bouldering Gym' },
          },
        }),
      ).toBe('https://dropanchor.app/checkin/3mgzw2gt5uu23');
    });
  });

  describe('askeverything', () => {
    it('maps app.askeverything.feed.answer to the askeverything app', () => {
      expect(getAppIdForCollection('app.askeverything.feed.answer')).toBe('askeverything');
    });

    it('links an answer to the author profile (no per-item URL, internal ids)', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'app.askeverything.feed.answer',
          record: { text: 'Both. Both is good.' },
        }),
      ).toBe('https://askeverything.app/profile/alice.test');
    });
  });

  describe('atmoBB forum', () => {
    it('links a discussion reply to its parent thread page from record.thread.uri', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'app.atmobb.discussion.reply',
          record: {
            thread: {
              uri: 'at://did:plc:threadowner/app.atmobb.discussion.thread/3mq24yxouok2n',
            },
            body: [{ $type: 'app.atmobb.richtext.block#text', text: 'Wuuuuuuurd' }],
          },
        }),
      ).toBe('https://atmobb.app/t/did:plc:threadowner/3mq24yxouok2n');
    });

    it('returns null for a reply when the thread uri is missing', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'app.atmobb.discussion.reply',
          record: { body: [{ $type: 'app.atmobb.richtext.block#text', text: 'hi' }] },
        }),
      ).toBeNull();
    });

    it('links a discussion thread to its own page from the item uri', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:threadowner/app.atmobb.discussion.thread/3mq24yxouok2n',
          rkey: '3mq24yxouok2n',
          authorDid: 'did:plc:threadowner',
          collection: 'app.atmobb.discussion.thread',
          record: { title: 'first topic', body: [] },
        }),
      ).toBe('https://atmobb.app/t/did:plc:threadowner/3mq24yxouok2n');
    });
  });

  describe('Chive eprints', () => {
    it('builds the URI-encoded at-uri path Chive expects', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:34mbm5v3umztwvvgnttvcz6e/pub.chive.eprint.submission/3mhedkrrm7w2p',
          rkey: '3mhedkrrm7w2p',
          authorDid: 'did:plc:34mbm5v3umztwvvgnttvcz6e',
          collection: 'pub.chive.eprint.submission',
          record: { title: 'Generating event descriptions', authors: [] },
        }),
      ).toBe(
        'https://chive.pub/eprints/at%3A%2F%2Fdid%3Aplc%3A34mbm5v3umztwvvgnttvcz6e%2Fpub.chive.eprint.submission%2F3mhedkrrm7w2p',
      );
    });
  });

  describe('Zeens collections', () => {
    it('builds the canonical handle-based collection URL', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:xt6g4fytvnnby2k2i3ocyu6w/app.photosky.collection/3mrqcieniro2j',
          rkey: '3mrqcieniro2j',
          authorDid: 'did:plc:xt6g4fytvnnby2k2i3ocyu6w',
          authorHandle: 'helene-cook.eu',
          collection: 'app.photosky.collection',
          record: { title: 'Japan nights', visibility: 'public' },
        }),
      ).toBe('https://zeens.app/profile/helene-cook.eu/collections/3mrqcieniro2j');
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

    it('atcr repo.page: handle + rkey (repository name) pattern', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          collection: 'io.atcr.repo.page',
          uri: 'at://did:plc:abc/io.atcr.repo.page/relay',
          rkey: 'relay',
          record: {},
        }),
      ).toBe('https://atcr.io/r/alice.test/relay');
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

    it('maps io.atcr.* to atcr', () => {
      expect(getAppIdForCollection('io.atcr.repo.page')).toBe('atcr');
      expect(getAppIdForCollection('io.atcr.manifest')).toBe('atcr');
    });

    it('maps batch-onboarded app prefixes to their app ids', () => {
      expect(getAppIdForCollection('app.mcp.server')).toBe('mcp');
      expect(getAppIdForCollection('app.userinput.discussion')).toBe('userinput');
      expect(getAppIdForCollection('community.lexicon.badge.award')).toBe('badges');
      expect(getAppIdForCollection('dev.atvouch.graph.vouch')).toBe('atvouch');
      expect(getAppIdForCollection('li.plonk.paste')).toBe('plonk');
      expect(getAppIdForCollection('tech.waow.doodl.drawing')).toBe('waow');
      expect(getAppIdForCollection('tech.waow.slides.deck')).toBe('waow');
      expect(getAppIdForCollection('wiki.lichen.note')).toBe('lichen');
      expect(getAppIdForCollection('stream.thought.blip')).toBe('streamthought');
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

  describe('pixl', () => {
    it('image: returns null — pixl.pics is auth-gated with no public per-record viewer', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:willow/pics.pixl.image/3msm5lkt4vg2u',
          rkey: '3msm5lkt4vg2u',
          authorDid: 'did:plc:willow',
          collection: 'pics.pixl.image',
          record: { alt: '', createdAt: '2026-08-08T22:46:07.964Z' },
        }),
      ).toBeNull();
    });
  });

  describe('guestbook', () => {
    it('entry: returns null — self-hosted widget has no public per-record viewer', () => {
      expect(
        resolveCardUrl({
          ...baseItem,
          uri: 'at://did:plc:signer/dev.baileytownsend.guestbook.entry/3mhw254fee52f',
          rkey: '3mhw254fee52f',
          authorDid: 'did:plc:signer',
          collection: 'dev.baileytownsend.guestbook.entry',
          record: { text: 'great to meet you!', subject: 'did:plc:owner' },
        }),
      ).toBeNull();
    });

    it('getAppIdForCollection maps dev.baileytownsend.guestbook.* to guestbook', () => {
      expect(getAppIdForCollection('dev.baileytownsend.guestbook.entry')).toBe('guestbook');
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
