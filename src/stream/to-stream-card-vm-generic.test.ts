import { describe, expect, it } from 'vitest';

import type { ActivityItem } from './activity-item.js';
import { streamCardVMSchema } from './stream-card-vm-schema.js';
import { toStreamCardVM } from './to-stream-card-vm.js';

const DID = 'did:plc:author';

/**
 * Build an ActivityItem for one base/unknown collection + record. These
 * collections have no typed body variant, so they flow through the generic
 * extractor. Each fixture copies the field shape the matching sifa-web card
 * reads (see `~/Git/sifa-web/src/components/activity-cards/`).
 */
function item(collection: string, record: unknown): ActivityItem {
  const rkey = '3kgeneric';
  return {
    uri: `at://${DID}/${collection}/${rkey}`,
    cid: 'bafyreigeneric',
    collection,
    rkey,
    appId: 'testapp',
    appName: 'Test App',
    category: 'Other',
    indexedAt: '2026-07-17T12:00:00.000Z',
    record,
  };
}

function expectValid(vm: unknown): void {
  const result = streamCardVMSchema.safeParse(vm);
  expect(result.success, JSON.stringify((result as { error?: unknown }).error)).toBe(true);
}

// ---------------------------------------------------------------------------
// Base collections — grounded in the dedicated sifa-web card each reproduces.
// ---------------------------------------------------------------------------

describe('applyGeneric — Margin annotation (at.margin.annotation)', () => {
  it('reads the annotation text from the `{ value }` body shape', () => {
    const vm = toStreamCardVM(
      item('at.margin.annotation', {
        body: { value: 'Great point about portable identity', format: 'text/plain' },
        target: { source: 'https://example.com/article' },
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'Great point about portable identity' });
    expectValid(vm);
  });

  it('also reads a plain-string body (schema drift)', () => {
    const vm = toStreamCardVM(
      item('at.margin.annotation', { body: 'inline note', createdAt: '2026-07-17T11:00:00.000Z' }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'inline note' });
  });
});

describe('applyGeneric — Margin bookmark (at.margin.bookmark)', () => {
  it('carries the source URL as an external link, the title as text, and tags', () => {
    const vm = toStreamCardVM(
      item('at.margin.bookmark', {
        source: 'https://blog.example.com/post',
        title: 'A great post',
        description: 'why it matters',
        tags: ['reading', 'ideas'],
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.externalLink).toEqual({ url: 'https://blog.example.com/post' });
    expect(vm.body).toEqual({ kind: 'text', text: 'A great post', tags: ['reading', 'ideas'] });
    expectValid(vm);
  });
});

describe('applyGeneric — Tangled (sh.tangled.*)', () => {
  it('prefers `name` for a repo record', () => {
    const vm = toStreamCardVM(
      item('sh.tangled.repo', {
        name: 'sifa-sdk',
        description: 'The SDK',
        language: 'TypeScript',
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'sifa-sdk' });
    expectValid(vm);
  });

  it('falls back to `title` for an issue record', () => {
    const vm = toStreamCardVM(
      item('sh.tangled.issue', {
        title: 'Bug: crash on startup',
        body: 'steps to reproduce',
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'Bug: crash on startup' });
  });
});

describe('applyGeneric — KipClip (community.lexicon.bookmarks.bookmark)', () => {
  it('carries the bookmarked URL as an external link and keeps tags on a link body', () => {
    const vm = toStreamCardVM(
      item('community.lexicon.bookmarks.bookmark', {
        subject: 'https://news.example.com/story',
        tags: ['news'],
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.externalLink).toEqual({ url: 'https://news.example.com/story' });
    expect(vm.subject).toBeUndefined(); // http subject is a bookmark target, not a record ref
    expect(vm.body).toEqual({ kind: 'link', tags: ['news'] });
    expectValid(vm);
  });
});

describe('applyGeneric — Grain gallery (social.grain.gallery)', () => {
  it('reads the title as text and the bare galleryMeta.coverPhotoCid as media', () => {
    const vm = toStreamCardVM(
      item('social.grain.gallery', {
        title: 'Weekend trip',
        description: 'photos from the coast',
        galleryMeta: { coverPhotoCid: 'bafcover', photoCount: 12 },
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'Weekend trip' });
    expect(vm.media).toEqual([{ did: DID, cid: 'bafcover', alt: 'Weekend trip' }]);
    expectValid(vm);
  });
});

describe('applyGeneric — asq question (fyi.asq.question)', () => {
  it('reads the title as text and carries tags', () => {
    const vm = toStreamCardVM(
      item('fyi.asq.question', {
        title: 'How do I export my profile?',
        body: 'Longer question body here.',
        tags: ['help', 'export'],
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({
      kind: 'text',
      text: 'How do I export my profile?',
      tags: ['help', 'export'],
    });
    expectValid(vm);
  });
});

describe('applyGeneric — Semble (app.sidetrail.*)', () => {
  it('reads the trail title as text', () => {
    const vm = toStreamCardVM(
      item('app.sidetrail.trail', {
        title: 'City heritage walk',
        description: 'a scenic route',
        stops: [{}, {}, {}],
        accentColor: 'rgb(10,20,30)',
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'City heritage walk' });
    expectValid(vm);
  });

  it('degrades to generic for a completion record with no free text', () => {
    const vm = toStreamCardVM(
      item('app.sidetrail.completion', {
        visitedStops: [{}],
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'generic' });
    expectValid(vm);
  });
});

describe('applyGeneric — Passports fifty-states (social.passports.fiftyStates.visit)', () => {
  it('extracts the city (state-name mapping stays a surface concern)', () => {
    const vm = toStreamCardVM(
      item('social.passports.fiftyStates.visit', {
        city: 'Charlotte',
        subdivision: 'US-NC',
        visitedAt: '2026-06-01',
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'Charlotte' });
    expectValid(vm);
  });
});

describe('applyGeneric — Streamplace (place.stream.livestream)', () => {
  it('reads the title as text and the thumb blob as media', () => {
    const vm = toStreamCardVM(
      item('place.stream.livestream', {
        title: 'Live coding session',
        thumb: { $type: 'blob', ref: { $link: 'bafthumb' }, mimeType: 'image/jpeg' },
        lastSeenAt: '2026-07-17T11:30:00.000Z',
        idleTimeoutSeconds: 300,
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'Live coding session' });
    expect(vm.media).toEqual([
      { did: DID, cid: 'bafthumb', alt: 'Live coding session', mimeType: 'image/jpeg' },
    ]);
    expectValid(vm);
  });
});

describe('applyGeneric — plain generic fallback', () => {
  it('reads text and a standard image blob for an unknown collection', () => {
    const vm = toStreamCardVM(
      item('com.example.thing', {
        text: 'plain content here',
        image: { $type: 'blob', ref: { $link: 'bafimg' }, mimeType: 'image/png' },
        createdAt: '2026-07-17T11:00:00.000Z',
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'plain content here' });
    expect(vm.media).toEqual([
      { did: DID, cid: 'bafimg', alt: 'plain content here', mimeType: 'image/png' },
    ]);
    expectValid(vm);
  });

  it('falls through the field order to `content` and then `status`', () => {
    expect(toStreamCardVM(item('com.example.a', { content: 'body copy' })).body).toEqual({
      kind: 'text',
      text: 'body copy',
    });
    expect(toStreamCardVM(item('com.example.b', { status: 'shipping it' })).body).toEqual({
      kind: 'text',
      text: 'shipping it',
    });
  });

  it('degrades to an empty generic body when nothing is extractable', () => {
    const vm = toStreamCardVM(item('com.example.empty', { createdAt: '2026-07-17T11:00:00.000Z' }));
    expect(vm.body).toEqual({ kind: 'generic' });
    expect(vm.media).toBeUndefined();
    expect(vm.externalLink).toBeUndefined();
    expect(vm.subject).toBeUndefined();
    expectValid(vm);
  });
});

// ---------------------------------------------------------------------------
// Best-effort heuristics for genuinely unknown / future collections.
// ---------------------------------------------------------------------------

describe('applyGeneric — heuristics for unknown apps', () => {
  it('slices bsky-style facets into richSegments (byte offsets)', () => {
    const vm = toStreamCardVM(
      item('com.example.post', {
        text: 'hello world',
        facets: [
          {
            index: { byteStart: 6, byteEnd: 11 },
            features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://example.com' }],
          },
        ],
      }),
    );
    expect(vm.body).toEqual({
      kind: 'text',
      text: 'hello world',
      richSegments: [{ text: 'hello ' }, { text: 'world', link: 'https://example.com' }],
    });
    expectValid(vm);
  });

  it('recognizes mention and tag facet features', () => {
    const vm = toStreamCardVM(
      item('com.example.post', {
        text: '@bob #sifa',
        facets: [
          {
            index: { byteStart: 0, byteEnd: 4 },
            features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:bob' }],
          },
          {
            index: { byteStart: 5, byteEnd: 10 },
            features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'sifa' }],
          },
        ],
      }),
    );
    if (vm.body?.kind !== 'text') throw new Error('expected text body');
    expect(vm.body.richSegments).toEqual([
      { text: '@bob', mention: 'did:plc:bob' },
      { text: ' ' },
      { text: '#sifa', tag: 'sifa' },
    ]);
  });

  it('omits richSegments when facets carry no recognizable feature', () => {
    const vm = toStreamCardVM(
      item('com.example.post', {
        text: 'plain',
        facets: [{ index: { byteStart: 0, byteEnd: 5 }, features: [{}] }],
      }),
    );
    expect(vm.body).toEqual({ kind: 'text', text: 'plain' });
  });

  it('maps an at:// subject to a record reference', () => {
    const vm = toStreamCardVM(
      item('com.example.answer', { subject: 'at://did:plc:x/fyi.asq.question/q1' }),
    );
    expect(vm.subject).toEqual({ kind: 'record', uri: 'at://did:plc:x/fyi.asq.question/q1' });
    expect(vm.body).toEqual({ kind: 'generic' });
  });

  it('maps a subject.uri strongRef to a record reference', () => {
    const vm = toStreamCardVM(
      item('com.example.reply', {
        subject: { uri: 'at://did:plc:x/app.bsky.feed.post/p1', cid: 'bafref' },
      }),
    );
    expect(vm.subject).toEqual({ kind: 'record', uri: 'at://did:plc:x/app.bsky.feed.post/p1' });
  });

  it('maps a bare did subject to a person reference', () => {
    const vm = toStreamCardVM(item('com.example.connect', { subject: 'did:plc:friend' }));
    expect(vm.subject).toEqual({ kind: 'person', did: 'did:plc:friend' });
  });

  it('maps a bare record.url to an external link', () => {
    const vm = toStreamCardVM(item('com.example.link', { url: 'https://example.com/page' }));
    expect(vm.externalLink).toEqual({ url: 'https://example.com/page' });
    expect(vm.body).toEqual({ kind: 'link' });
  });

  it('extracts every image in an images[] array with per-item alt', () => {
    const vm = toStreamCardVM(
      item('com.example.album', {
        images: [
          { image: { $type: 'blob', ref: { $link: 'baf1' } }, alt: 'first' },
          { image: { $type: 'blob', ref: { $link: 'baf2' } }, alt: 'second' },
        ],
      }),
    );
    expect(vm.media).toEqual([
      { did: DID, cid: 'baf1', alt: 'first' },
      { did: DID, cid: 'baf2', alt: 'second' },
    ]);
    expect(vm.body).toEqual({ kind: 'media' });
  });
});
