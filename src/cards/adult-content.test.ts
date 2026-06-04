import { describe, expect, it } from 'vitest';
import { ADULT_CONTENT_LABELS, hasAdultContent, type ActivityLabel } from './adult-content.js';

const label = (val: string, overrides: Partial<ActivityLabel> = {}): ActivityLabel => ({
  val,
  src: 'did:plc:ar7c4by46qjdydhdevvrndac',
  uri: 'at://did:plc:author/app.bsky.feed.post/abc',
  cts: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('ADULT_CONTENT_LABELS', () => {
  it('matches the four Bluesky global adult labels', () => {
    expect(ADULT_CONTENT_LABELS).toEqual(['porn', 'sexual', 'nudity', 'graphic-media']);
  });
});

describe('hasAdultContent', () => {
  it('returns false when labels is undefined', () => {
    expect(hasAdultContent({})).toBe(false);
  });

  it('returns false when labels is empty', () => {
    expect(hasAdultContent({ labels: [] })).toBe(false);
  });

  it('returns false for unrelated labels', () => {
    expect(hasAdultContent({ labels: [label('spam'), label('!hide')] })).toBe(false);
  });

  it('returns true when a single adult label is present', () => {
    for (const val of ADULT_CONTENT_LABELS) {
      expect(hasAdultContent({ labels: [label(val)] })).toBe(true);
    }
  });

  it('returns true when at least one of several labels is adult', () => {
    expect(hasAdultContent({ labels: [label('spam'), label('nudity')] })).toBe(true);
  });

  it('ignores negated adult labels', () => {
    expect(hasAdultContent({ labels: [label('porn', { neg: true })] })).toBe(false);
  });

  it('still flags adult content when a different label is negated', () => {
    expect(hasAdultContent({ labels: [label('porn', { neg: true }), label('nudity')] })).toBe(true);
  });
});
