import { describe, it, expect } from 'vitest';
import { isSelfAuthoredRich, renderAsLine } from './two-tier.js';
import type { StreamCardVM } from './stream-card-vm.js';

function vm(overrides: Partial<StreamCardVM>): StreamCardVM {
  return {
    uri: 'at://did:plc:actor/app.bsky.feed.post/1',
    cid: 'cid',
    verb: 'posted',
    source: { appId: 'bluesky', label: 'Bluesky', color: 'blue' },
    tier: 'creation',
    timestamp: '2026-09-14T00:00:00.000Z',
    title: 'posted',
    ...overrides,
  };
}

describe('isSelfAuthoredRich', () => {
  it('is true for a creation with media (their own photo)', () => {
    expect(isSelfAuthoredRich(vm({ media: [{ alt: '', url: 'https://cdn.example/p.jpg' }] }))).toBe(
      true,
    );
  });

  it('is true for a creation with a structured rich body (a book log)', () => {
    expect(
      isSelfAuthoredRich(vm({ body: { kind: 'book', title: 'Dune', authors: ['Herbert'] } })),
    ).toBe(true);
  });

  it('is true for a creation with an external link card', () => {
    expect(
      isSelfAuthoredRich(vm({ externalLink: { url: 'https://example.com', title: 'x' } })),
    ).toBe(true);
  });

  it('is false for a relational action, even with a subject (RSVP to someone else’s event)', () => {
    expect(
      isSelfAuthoredRich(
        vm({
          tier: 'action',
          verb: 'created',
          body: { kind: 'event-rsvp', rsvpStatus: 'going', eventName: 'ATmosphere Conf' },
          subject: { kind: 'record', uri: 'at://did:plc:host/x/1', title: 'ATmosphere Conf' },
        }),
      ),
    ).toBe(false);
  });

  it('is false for a relational activity even with media (a comment on someone’s photo)', () => {
    expect(
      isSelfAuthoredRich(
        vm({
          uri: 'at://did:plc:actor/pub.leaflet.comment/1',
          media: [{ alt: '', url: 'https://cdn.example/theirs.jpg' }],
        }),
      ),
    ).toBe(false);
  });

  it('is false for a thin creation that is only text (a bare “:)”)', () => {
    expect(isSelfAuthoredRich(vm({ body: { kind: 'text', text: ':)' } }))).toBe(false);
  });

  it('is false for a text-only creation regardless of length (text renders inline on the line)', () => {
    expect(isSelfAuthoredRich(vm({ body: { kind: 'text', text: 'a'.repeat(600) } }))).toBe(false);
  });
});

describe('renderAsLine', () => {
  it('is the inverse of isSelfAuthoredRich', () => {
    const rich = vm({ media: [{ alt: '', url: 'https://cdn.example/p.jpg' }] });
    const line = vm({ tier: 'action', body: { kind: 'event-rsvp', rsvpStatus: 'going' } });
    expect(renderAsLine(rich)).toBe(false);
    expect(renderAsLine(line)).toBe(true);
  });
});
