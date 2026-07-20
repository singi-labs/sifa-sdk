import { describe, expect, it } from 'vitest';

import type { StreamCardVM } from './stream-card-vm.js';
import { streamCardVMSchema, streamMediaSchema } from './stream-card-vm-schema.js';

const baseVM: StreamCardVM = {
  uri: 'at://did:plc:abc/app.bsky.feed.post/3k',
  cid: 'bafyreiabc',
  verb: 'posted',
  source: { appId: 'bluesky', label: 'Bluesky', color: 'slate' },
  tier: 'creation',
  timestamp: '2026-07-17T10:00:00.000Z',
  title: 'Posted on Bluesky',
  body: { kind: 'text', text: 'hello world' },
};

describe('streamCardVMSchema', () => {
  it('accepts a minimal valid VM', () => {
    expect(streamCardVMSchema.safeParse(baseVM).success).toBe(true);
  });

  it('accepts a VM with a sourceUrl and one that omits it', () => {
    expect(
      streamCardVMSchema.safeParse({
        ...baseVM,
        sourceUrl: 'https://bsky.app/profile/alice.test/post/3k',
      }).success,
    ).toBe(true);
    // baseVM omits sourceUrl (optional).
    expect(streamCardVMSchema.safeParse(baseVM).success).toBe(true);
    expect(baseVM.sourceUrl).toBeUndefined();
  });

  it('accepts a VM with blob media, theme, and external link', () => {
    const vm: StreamCardVM = {
      ...baseVM,
      body: { kind: 'media' },
      media: [{ did: 'did:plc:abc', cid: 'bafkreiimg', alt: 'a photo' }],
      externalLink: { url: 'https://example.com', title: 'Example' },
      theme: {
        background: { r: 255, g: 255, b: 255 },
        foreground: { r: 0, g: 0, b: 0 },
        accent: { r: 67, g: 133, b: 190 },
      },
    };
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });

  it('accepts a repost VM with a nested post subject (recursive)', () => {
    const vm: StreamCardVM = {
      ...baseVM,
      verb: 'reposted',
      body: { kind: 'generic' },
      subject: { kind: 'post', post: baseVM },
    };
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });

  it('accepts person and record subjects', () => {
    const person = streamCardVMSchema.safeParse({
      ...baseVM,
      subject: { kind: 'person', did: 'did:plc:xyz', handle: 'bob.test' },
    });
    const record = streamCardVMSchema.safeParse({
      ...baseVM,
      subject: { kind: 'record', uri: 'at://did:plc:xyz/fyi.asq.question/1', title: 'Why?' },
    });
    expect(person.success).toBe(true);
    expect(record.success).toBe(true);
  });

  it('accepts and preserves an author identity block', () => {
    const author = {
      did: 'did:plc:abc',
      handle: 'alice.test',
      displayName: 'Alice',
      avatar: 'https://cdn.example/avatar/alice.jpg',
    };
    const parsed = streamCardVMSchema.safeParse({ ...baseVM, author });
    expect(parsed.success).toBe(true);
    // Zod strips unknown keys by default, so this also guards that `author`
    // is a modelled field and survives parsing (renderers rely on it).
    if (parsed.success) expect(parsed.data.author).toEqual(author);
  });

  it('rejects an unknown verb', () => {
    expect(streamCardVMSchema.safeParse({ ...baseVM, verb: 'liked' }).success).toBe(false);
  });

  it('rejects an unknown body kind', () => {
    expect(
      streamCardVMSchema.safeParse({ ...baseVM, body: { kind: 'nope', text: 'x' } }).success,
    ).toBe(false);
  });

  it('accepts each app-specific body variant', () => {
    const bodies: StreamCardVM['body'][] = [
      {
        kind: 'github-pr',
        repoOwner: 'a',
        repoName: 'b',
        prNumber: 1,
        title: 't',
        additions: 3,
        deletions: 1,
      },
      { kind: 'book', title: 'B', authors: ['A'], stars: 8 },
      { kind: 'media-review', reviewKind: 'review', isRevisit: false, rating: 7 },
      { kind: 'event-rsvp', rsvpStatus: 'going', mode: 'inperson' },
      { kind: 'verification', platform: 'github', verified: true },
      { kind: 'membership', communityName: 'C' },
      { kind: 'location', venueName: 'V', geo: { latitude: 52, longitude: 5 } },
      { kind: 'travel', origin: 'AMS', destination: 'JFK' },
      { kind: 'standard-site', title: 'Doc', readingTime: 3 },
    ];
    for (const body of bodies) {
      expect(streamCardVMSchema.safeParse({ ...baseVM, body }).success).toBe(true);
    }
  });

  it('rejects an invalid rsvpStatus enum', () => {
    expect(
      streamCardVMSchema.safeParse({
        ...baseVM,
        body: { kind: 'event-rsvp', rsvpStatus: 'maybe' },
      }).success,
    ).toBe(false);
  });

  it('rejects an out-of-range theme channel', () => {
    const bad = streamCardVMSchema.safeParse({
      ...baseVM,
      theme: {
        background: { r: 300, g: 0, b: 0 },
        foreground: { r: 0, g: 0, b: 0 },
        accent: { r: 0, g: 0, b: 0 },
      },
    });
    expect(bad.success).toBe(false);
  });
});

describe('streamMediaSchema', () => {
  it('accepts a resolved-URL media item', () => {
    expect(streamMediaSchema.safeParse({ url: 'https://cdn/x.jpg', alt: '' }).success).toBe(true);
  });

  it('accepts a blob-ref media item', () => {
    expect(streamMediaSchema.safeParse({ did: 'did:plc:abc', cid: 'bafk', alt: '' }).success).toBe(
      true,
    );
  });
});
