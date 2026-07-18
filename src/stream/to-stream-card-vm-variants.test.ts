import { describe, expect, it } from 'vitest';

import type { ActivityItem } from './activity-item.js';
import { streamCardVMSchema } from './stream-card-vm-schema.js';
import { toStreamCardVM } from './to-stream-card-vm.js';

const DID = 'did:plc:author';

/** Build an ActivityItem with sensible defaults for one collection + record. */
function item(
  collection: string,
  record: unknown,
  overrides: Partial<ActivityItem> = {},
): ActivityItem {
  const rkey = '3ktest';
  return {
    uri: `at://${DID}/${collection}/${rkey}`,
    cid: 'bafyreitest',
    collection,
    rkey,
    appId: 'testapp',
    appName: 'Test App',
    category: 'Other',
    indexedAt: '2026-07-17T12:00:00.000Z',
    record,
    ...overrides,
  };
}

function expectValid(vm: unknown): void {
  const result = streamCardVMSchema.safeParse(vm);
  expect(result.success, JSON.stringify((result as { error?: unknown }).error)).toBe(true);
}

describe('toStreamCardVM — github-pr', () => {
  const record = {
    prNumber: 42,
    repoOwner: 'singi-labs',
    repoName: 'sifa-sdk',
    title: 'Add stream body variants',
    url: 'https://github.com/singi-labs/sifa-sdk/pull/42',
    language: 'TypeScript',
    additions: 120,
    deletions: 8,
    mergedAt: '2026-07-16T09:30:00.000Z',
  };

  it('maps PR stats, repo, and language', () => {
    const vm = toStreamCardVM(item('github.pull_request', record));
    expect(vm.body).toEqual({
      kind: 'github-pr',
      repoOwner: 'singi-labs',
      repoName: 'sifa-sdk',
      prNumber: 42,
      title: 'Add stream body variants',
      url: 'https://github.com/singi-labs/sifa-sdk/pull/42',
      language: 'TypeScript',
      additions: 120,
      deletions: 8,
      mergedAt: '2026-07-16T09:30:00.000Z',
    });
    expectValid(vm);
  });

  it('omits a null language and defaults missing diff stats to 0', () => {
    const vm = toStreamCardVM(
      item('github.pull_request', {
        prNumber: 1,
        repoOwner: 'a',
        repoName: 'b',
        title: 't',
        url: 'https://github.com/a/b/pull/1',
        language: null,
      }),
    );
    expect(vm.body).toMatchObject({ kind: 'github-pr', additions: 0, deletions: 0 });
    if (vm.body?.kind === 'github-pr') expect(vm.body.language).toBeUndefined();
    expectValid(vm);
  });
});

describe('toStreamCardVM — book', () => {
  const record = {
    title: 'The Left Hand of Darkness',
    authors: 'Ursula K. Le Guin\tSomeone Else',
    review: 'A masterwork of speculative fiction.',
    stars: 9,
    status: 'buzz.bookhive.defs#finished',
    cover: { $type: 'blob', ref: { $link: 'bafkreicover' }, mimeType: 'image/jpeg' },
    createdAt: '2026-07-17T10:00:00.000Z',
  };

  it('maps rating, status, authors, review and carries the cover as a blob ref', () => {
    const vm = toStreamCardVM(item('buzz.bookhive.book', record));
    expect(vm.body).toEqual({
      kind: 'book',
      title: 'The Left Hand of Darkness',
      authors: ['Ursula K. Le Guin', 'Someone Else'],
      stars: 9,
      status: 'buzz.bookhive.defs#finished',
      review: 'A masterwork of speculative fiction.',
    });
    expect(vm.media?.[0]).toEqual({
      did: DID,
      cid: 'bafkreicover',
      alt: 'The cover of The Left Hand of Darkness',
      mimeType: 'image/jpeg',
    });
    expectValid(vm);
  });

  it('reads a denormalized `{cid}` cover and omits a zero rating', () => {
    const vm = toStreamCardVM(
      item('buzz.bookhive.book', {
        title: 'Untitled',
        authors: '',
        stars: 0,
        cover: { cid: 'bafkreiplain' },
      }),
    );
    expect(vm.body).toMatchObject({ kind: 'book', authors: [] });
    if (vm.body?.kind === 'book') expect(vm.body.stars).toBeUndefined();
    expect(vm.media?.[0]).toMatchObject({ did: DID, cid: 'bafkreiplain' });
    expectValid(vm);
  });
});

describe('toStreamCardVM — media-review (popfeed)', () => {
  it('maps a review with rating, media type, revisit flag, and poster URL', () => {
    const vm = toStreamCardVM(
      item('social.popfeed.feed.review', {
        title: 'Dune',
        text: 'Denis nailed it.',
        rating: 8,
        creativeWorkType: 'movie',
        posterUrl: 'https://cdn.popfeed.social/dune.jpg',
        mainCredit: 'Denis Villeneuve',
        isRevisit: true,
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'media-review',
      reviewKind: 'review',
      title: 'Dune',
      mediaType: 'movie',
      rating: 8,
      mainCredit: 'Denis Villeneuve',
      reviewText: 'Denis nailed it.',
      isRevisit: true,
    });
    expect(vm.media?.[0]).toEqual({
      url: 'https://cdn.popfeed.social/dune.jpg',
      alt: 'Dune poster',
    });
    expectValid(vm);
  });

  it('classifies notes and posts by collection suffix and falls back title to name', () => {
    const note = toStreamCardVM(
      item('social.popfeed.feed.note', { name: 'Quick note', text: 'hi', isRevisit: false }),
    );
    expect(note.body).toMatchObject({
      kind: 'media-review',
      reviewKind: 'note',
      title: 'Quick note',
    });

    const post = toStreamCardVM(item('social.popfeed.feed.post', { text: 'a post' }));
    expect(post.body).toMatchObject({ kind: 'media-review', reviewKind: 'post', isRevisit: false });
    expectValid(note);
    expectValid(post);
  });
});

describe('toStreamCardVM — event-rsvp', () => {
  it('normalizes RSVP status, mode, date range and location parts', () => {
    const vm = toStreamCardVM(
      item('community.lexicon.calendar.rsvp', {
        status: 'community.lexicon.calendar.rsvp#going',
        subject: { uri: 'at://did:plc:host/community.lexicon.calendar.event/evt' },
        createdAt: '2026-07-17T10:00:00.000Z',
        eventMeta: {
          name: 'ATmosphere Conf',
          startsAt: '2026-09-01T09:00:00.000Z',
          endsAt: '2026-09-02T17:00:00.000Z',
          mode: 'community.lexicon.calendar.event#inperson',
          locationName: 'Community Hall',
          locationLocality: 'Amsterdam',
          locationCountry: 'NL',
        },
      }),
    );
    expect(vm.body).toEqual({
      kind: 'event-rsvp',
      rsvpStatus: 'going',
      eventName: 'ATmosphere Conf',
      startsAt: '2026-09-01T09:00:00.000Z',
      endsAt: '2026-09-02T17:00:00.000Z',
      mode: 'inperson',
      locationName: 'Community Hall',
      locationLocality: 'Amsterdam',
      locationCountry: 'NL',
    });
    expectValid(vm);
  });

  it('accepts a bare "#interested" status and unknown mode', () => {
    const vm = toStreamCardVM(
      item('community.lexicon.calendar.rsvp', {
        status: '#interested',
        eventMeta: { name: 'Meetup', mode: '#weird' },
      }),
    );
    expect(vm.body).toMatchObject({
      kind: 'event-rsvp',
      rsvpStatus: 'interested',
      eventName: 'Meetup',
    });
    if (vm.body?.kind === 'event-rsvp') expect(vm.body.mode).toBeUndefined();
    expectValid(vm);
  });

  it('falls back rsvpStatus to "unknown" when absent', () => {
    const vm = toStreamCardVM(item('community.lexicon.calendar.rsvp', { eventMeta: {} }));
    expect(vm.body).toMatchObject({ kind: 'event-rsvp', rsvpStatus: 'unknown' });
    expectValid(vm);
  });
});

describe('toStreamCardVM — verification', () => {
  it('maps a keytrace claim (platform, verified flag, subject, profile url)', () => {
    const vm = toStreamCardVM(
      item('dev.keytrace.claim', {
        type: 'github',
        status: 'verified',
        identity: {
          subject: 'octocat',
          displayName: 'The Octocat',
          profileUrl: 'https://github.com/octocat',
        },
        sigs: [{ signedAt: '2026-07-10T00:00:00.000Z' }],
      }),
    );
    expect(vm.body).toEqual({
      kind: 'verification',
      platform: 'github',
      verified: true,
      subjectLabel: 'The Octocat',
      profileUrl: 'https://github.com/octocat',
    });
    expectValid(vm);
  });

  it('marks an unverified keytrace claim', () => {
    const vm = toStreamCardVM(
      item('dev.keytrace.claim', {
        type: 'dns',
        status: 'pending',
        identity: { subject: 'example.com' },
      }),
    );
    expect(vm.body).toMatchObject({
      kind: 'verification',
      platform: 'dns',
      verified: false,
      subjectLabel: 'example.com',
    });
    expectValid(vm);
  });

  it('maps a bsky graph verification (always verified, carries handle)', () => {
    const vm = toStreamCardVM(
      item('app.bsky.graph.verification', {
        handle: 'alice.test',
        displayName: 'Alice',
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'verification',
      platform: 'bluesky',
      verified: true,
      subjectLabel: 'Alice',
      handle: 'alice.test',
    });
    expectValid(vm);
  });
});

describe('toStreamCardVM — membership', () => {
  it('maps community name/description and carries the picture blob with the owner DID', () => {
    const ownerDid = 'did:plc:community';
    const vm = toStreamCardVM(
      item('social.colibri.membership', {
        community: `at://${ownerDid}/social.colibri.community/room`,
        communityMeta: {
          name: 'ATProto Builders',
          description: 'Folks building on the protocol.',
          picture: { $type: 'blob', ref: { $link: 'bafkreipic' } },
          ownerDid,
        },
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'membership',
      communityName: 'ATProto Builders',
      description: 'Folks building on the protocol.',
      communityUri: `at://${ownerDid}/social.colibri.community/room`,
    });
    expect(vm.media?.[0]).toMatchObject({ did: ownerDid, cid: 'bafkreipic' });
    expectValid(vm);
  });

  it('falls back the picture owner DID to the community uri when ownerDid is absent', () => {
    const vm = toStreamCardVM(
      item('social.colibri.membership', {
        community: 'at://did:plc:fromuri/social.colibri.community/room',
        communityMeta: { name: 'X', picture: { cid: 'bafkreicidonly' } },
      }),
    );
    expect(vm.media?.[0]).toMatchObject({ did: 'did:plc:fromuri', cid: 'bafkreicidonly' });
    expectValid(vm);
  });
});

describe('toStreamCardVM — location (beacon)', () => {
  it('maps venue, shout and a structured address', () => {
    const vm = toStreamCardVM(
      item('app.beaconbits.beacon', {
        shout: 'Great coffee here',
        venueName: 'Cafe Alpha',
        addressDetails: {
          name: 'Cafe Alpha',
          street: '1 Main St',
          locality: 'Utrecht',
          region: 'UT',
          country: 'NL',
          postalCode: '3500',
        },
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'location',
      venueName: 'Cafe Alpha',
      shout: 'Great coffee here',
      address: {
        name: 'Cafe Alpha',
        street: '1 Main St',
        locality: 'Utrecht',
        region: 'UT',
        country: 'NL',
        postalCode: '3500',
      },
    });
    expectValid(vm);
  });

  it('parses string geo coordinates into numbers', () => {
    const vm = toStreamCardVM(
      item('app.beaconbits.beacon', {
        venueName: 'Somewhere',
        location: { latitude: '52.0907', longitude: '5.1214' },
      }),
    );
    expect(vm.body).toMatchObject({
      kind: 'location',
      geo: { latitude: 52.0907, longitude: 5.1214 },
    });
    expectValid(vm);
  });
});

describe('toStreamCardVM — travel', () => {
  it('maps origin, destination, transportation, carrier and dates', () => {
    const vm = toStreamCardVM(
      item('social.passports.travel.leg', {
        carrier: 'KLM',
        carrierCode: 'KL',
        transportation: 'flight',
        originTransportCode: 'AMS',
        destinationTransportCode: 'JFK',
        startDate: '2026-08-01',
        endDate: '2026-08-01',
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'travel',
      origin: 'AMS',
      destination: 'JFK',
      transportation: 'flight',
      carrier: 'KLM',
      carrierCode: 'KL',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
    });
    expectValid(vm);
  });
});

describe('toStreamCardVM — standard-site', () => {
  it('maps title/description, resolves reading time and a known publisher, carries enrichment URLs and theme', () => {
    const vm = toStreamCardVM(
      item('site.standard.document', {
        title: 'On Portable Identity',
        description: 'Why ownership beats hosting.',
        publishedAt: '2026-07-15T00:00:00.000Z',
        textContent: 'word '.repeat(400).trim(),
        path: '/on-portable-identity',
        site: 'at://did:plc:pub/site.standard.publication/blog',
        siteUrl: 'https://leaflet.pub',
        publicationTheme: {
          background: { r: 255, g: 255, b: 255 },
          foreground: { r: 0, g: 0, b: 0 },
          accent: { r: 67, g: 133, b: 190 },
          accentForeground: { r: 255, g: 255, b: 255 },
        },
        publicationIcon: 'https://cdn.example.com/icon.png',
        coverImageUrl: 'https://cdn.example.com/cover.png',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'standard-site',
      title: 'On Portable Identity',
      description: 'Why ownership beats hosting.',
      siteUrl: 'https://leaflet.pub',
      path: '/on-portable-identity',
      publisherName: 'Leaflet',
      icon: 'https://cdn.example.com/icon.png',
      coverImageUrl: 'https://cdn.example.com/cover.png',
      readingTime: 2,
      publishedAt: '2026-07-15T00:00:00.000Z',
    });
    // The publication theme (3 validated channels) rides on the shared vm.theme.
    expect(vm.theme?.accent).toEqual({ r: 67, g: 133, b: 190 });
    expectValid(vm);
  });

  it('omits publisherName for an unknown host', () => {
    const vm = toStreamCardVM(
      item('site.standard.document', { title: 'x', siteUrl: 'https://unknown.example' }),
    );
    expect(vm.body).toMatchObject({ kind: 'standard-site', siteUrl: 'https://unknown.example' });
    if (vm.body?.kind === 'standard-site') expect(vm.body.publisherName).toBeUndefined();
    expectValid(vm);
  });
});

describe('toStreamCardVM — subject widening', () => {
  it('at.youandme.connection → a person subject from the record DID', () => {
    const subjectDid = 'did:plc:friend';
    const vm = toStreamCardVM(
      item('at.youandme.connection', {
        subject: subjectDid,
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.verb).toBe('joined');
    expect(vm.subject).toEqual({ kind: 'person', did: subjectDid });
    expectValid(vm);
  });

  it('fyi.asq.answer → a record subject pointing at the answered question', () => {
    const questionUri = 'at://did:plc:asker/fyi.asq.question/q1';
    const vm = toStreamCardVM(
      item('fyi.asq.answer', {
        body: 'Because the protocol is open.',
        subject: { uri: questionUri },
        createdAt: '2026-07-17T10:00:00.000Z',
      }),
    );
    expect(vm.subject).toEqual({ kind: 'record', uri: questionUri });
    expectValid(vm);
  });

  it('does not set a subject for a youandme record with a missing DID', () => {
    const vm = toStreamCardVM(
      item('at.youandme.connection', { createdAt: '2026-07-17T10:00:00.000Z' }),
    );
    expect(vm.subject).toBeUndefined();
    expectValid(vm);
  });
});
