import { describe, expect, it } from 'vitest';

import type { StreamCardVM } from './stream-card-vm.js';
import { isTimelineWorthy } from './timeline-worthy.js';

function vm(overrides: Partial<StreamCardVM>): StreamCardVM {
  return {
    uri: 'at://did:plc:actor/com.example.thing/1',
    cid: 'cid',
    verb: 'created',
    source: { appId: 'example', label: 'Example', color: 'blue' },
    tier: 'creation',
    timestamp: '2026-10-17T00:00:00.000Z',
    title: 'Shared',
    ...overrides,
  };
}

describe('isTimelineWorthy', () => {
  it('accepts a line with content and a link', () => {
    expect(
      isTimelineWorthy(
        vm({ body: { kind: 'text', text: 'hello' }, sourceUrl: 'https://example.com/1' }),
      ),
    ).toBe(true);
  });

  it('rejects a line with content but no link', () => {
    expect(isTimelineWorthy(vm({ body: { kind: 'text', text: 'hello' } }))).toBe(false);
  });

  it('rejects a bare verb with a link but nothing concrete', () => {
    expect(isTimelineWorthy(vm({ sourceUrl: 'https://example.com/1' }))).toBe(false);
  });

  it('accepts a record subject with its own url', () => {
    expect(
      isTimelineWorthy(
        vm({
          verb: 'replied',
          title: 'Replied to',
          subject: {
            kind: 'record',
            uri: 'at://x/y/z',
            title: 'An article',
            url: 'https://a.example',
          },
        }),
      ),
    ).toBe(true);
  });

  it('rejects a titled record subject with no url anywhere', () => {
    expect(
      isTimelineWorthy(
        vm({
          verb: 'replied',
          subject: { kind: 'record', uri: 'at://x/y/z', title: 'An article' },
        }),
      ),
    ).toBe(false);
  });

  it('accepts a person subject with a handle (links to their profile)', () => {
    expect(
      isTimelineWorthy(
        vm({
          verb: 'followed',
          subject: { kind: 'person', did: 'did:plc:bob', handle: 'bob.test' },
        }),
      ),
    ).toBe(true);
  });

  it('rejects a person subject with only a display name', () => {
    expect(
      isTimelineWorthy(
        vm({
          verb: 'followed',
          subject: { kind: 'person', did: 'did:plc:bob', displayName: 'Bob' },
        }),
      ),
    ).toBe(false);
  });

  it('accepts a rich card (media) that links out', () => {
    expect(
      isTimelineWorthy(
        vm({ media: [{ alt: '', url: 'https://cdn.example/p.jpg' }], sourceUrl: 'https://e.x/1' }),
      ),
    ).toBe(true);
  });

  it('rejects a rich card with no link', () => {
    expect(isTimelineWorthy(vm({ media: [{ alt: '', url: 'https://cdn.example/p.jpg' }] }))).toBe(
      false,
    );
  });

  it('accepts a bare membership: the app is what was joined', () => {
    expect(
      isTimelineWorthy(vm({ verb: 'joined', title: 'Joined', sourceUrl: 'https://atproto.eu' })),
    ).toBe(true);
  });

  it('rejects a bare membership with no link', () => {
    expect(isTimelineWorthy(vm({ verb: 'joined', title: 'Joined' }))).toBe(false);
  });

  // A profile or app homepage is not a link to what the person did.
  it('rejects content whose only link is a profile fallback', () => {
    expect(
      isTimelineWorthy(
        vm({
          body: { kind: 'text', text: 'hello' },
          sourceUrl: 'https://passports.social/profile/alice.test',
          sourceUrlIsProfile: true,
        }),
      ),
    ).toBe(false);
  });

  it('accepts a membership whose link is the community members page', () => {
    expect(
      isTimelineWorthy(
        vm({
          verb: 'joined',
          title: 'Joined',
          sourceUrl: 'https://atproto.eu/members',
          sourceUrlIsProfile: true,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a post subject whose only link is a profile', () => {
    const nested = vm({
      body: { kind: 'text', text: 'quoted' },
      sourceUrl: 'https://passports.social/profile/bob',
      sourceUrlIsProfile: true,
    });
    expect(
      isTimelineWorthy(vm({ verb: 'reposted', subject: { kind: 'post', post: nested } })),
    ).toBe(false);
  });
});
