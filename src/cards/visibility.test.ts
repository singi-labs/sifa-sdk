import { describe, expect, it } from 'vitest';

import { isVisibleActivityItem } from './visibility.js';

describe('isVisibleActivityItem', () => {
  describe('unknown collections', () => {
    it('returns true for collections without a visibility rule', () => {
      expect(isVisibleActivityItem('com.example.unknown', { foo: 'bar' })).toBe(true);
    });

    it('returns false for non-object records regardless of collection', () => {
      expect(isVisibleActivityItem('com.example.unknown', null)).toBe(false);
      expect(isVisibleActivityItem('com.example.unknown', undefined)).toBe(false);
      expect(isVisibleActivityItem('com.example.unknown', 'string')).toBe(false);
      expect(isVisibleActivityItem('com.example.unknown', 42)).toBe(false);
    });
  });

  describe('buzz.bookhive.book', () => {
    const collection = 'buzz.bookhive.book';

    it('hides bare shelf adds (no review, no stars)', () => {
      expect(isVisibleActivityItem(collection, {})).toBe(false);
      expect(isVisibleActivityItem(collection, { review: '', stars: 0 })).toBe(false);
      expect(isVisibleActivityItem(collection, { review: '   ', stars: 0 })).toBe(false);
      expect(
        isVisibleActivityItem(collection, { status: 'buzz.bookhive.defs#wantToRead' }),
      ).toBe(false);
    });

    it('shows records with a non-empty review', () => {
      expect(isVisibleActivityItem(collection, { review: 'Loved it', stars: 0 })).toBe(true);
    });

    it('shows records with stars > 0 even without a review', () => {
      expect(isVisibleActivityItem(collection, { stars: 8 })).toBe(true);
    });

    it('treats non-number stars as 0', () => {
      expect(isVisibleActivityItem(collection, { stars: '8' })).toBe(false);
    });
  });

  describe('app.beaconbits.beacon', () => {
    const collection = 'app.beaconbits.beacon';

    it('hides bare location pins (no shout, no postRef)', () => {
      expect(isVisibleActivityItem(collection, {})).toBe(false);
      expect(isVisibleActivityItem(collection, { shout: '' })).toBe(false);
      expect(isVisibleActivityItem(collection, { shout: '   ' })).toBe(false);
    });

    it('shows pins with a shout', () => {
      expect(isVisibleActivityItem(collection, { shout: 'Hello from Lisbon' })).toBe(true);
    });

    it('shows pins with a postRef', () => {
      expect(isVisibleActivityItem(collection, { postRef: 'at://did:plc:x/foo/1' })).toBe(true);
    });
  });

  describe('at.margin.bookmark', () => {
    const collection = 'at.margin.bookmark';

    it('hides bookmarks without a source URL', () => {
      expect(isVisibleActivityItem(collection, {})).toBe(false);
      expect(isVisibleActivityItem(collection, { source: '' })).toBe(false);
      expect(isVisibleActivityItem(collection, { source: 123 })).toBe(false);
    });

    it('shows bookmarks with a source URL', () => {
      expect(isVisibleActivityItem(collection, { source: 'https://example.com' })).toBe(true);
    });
  });

  describe('at.margin.annotation', () => {
    const collection = 'at.margin.annotation';

    it('hides annotations without body text', () => {
      expect(isVisibleActivityItem(collection, {})).toBe(false);
      expect(isVisibleActivityItem(collection, { body: '' })).toBe(false);
      expect(isVisibleActivityItem(collection, { body: '   ' })).toBe(false);
      expect(isVisibleActivityItem(collection, { body: { value: '' } })).toBe(false);
      expect(isVisibleActivityItem(collection, { body: { value: '   ' } })).toBe(false);
      expect(isVisibleActivityItem(collection, { body: { format: 'markdown' } })).toBe(false);
    });

    it('shows annotations with body as a plain string', () => {
      expect(isVisibleActivityItem(collection, { body: 'A thought.' })).toBe(true);
    });

    it('shows annotations with body as { value, format }', () => {
      expect(
        isVisibleActivityItem(collection, { body: { value: 'A thought.', format: 'markdown' } }),
      ).toBe(true);
    });
  });
});
