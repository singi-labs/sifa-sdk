import { describe, expect, it } from 'vitest';

import { formatRelationship, parseEndorsementComment } from './endorsement-context.js';

describe('parseEndorsementComment', () => {
  it('returns nulls for an empty comment', () => {
    expect(parseEndorsementComment(undefined)).toEqual({ relationship: null, note: null });
    expect(parseEndorsementComment(null)).toEqual({ relationship: null, note: null });
    expect(parseEndorsementComment('')).toEqual({ relationship: null, note: null });
  });

  it('returns the note when there is no relationship prefix', () => {
    expect(parseEndorsementComment('great colleague')).toEqual({
      relationship: null,
      note: 'great colleague',
    });
  });

  it('maps a bare relationship token to its label with no note', () => {
    expect(parseEndorsementComment('[co_authored]')).toEqual({
      relationship: 'Co-authored',
      note: null,
    });
  });

  it('splits a relationship token and the trailing note', () => {
    expect(parseEndorsementComment('[co_authored] TEST')).toEqual({
      relationship: 'Co-authored',
      note: 'TEST',
    });
  });

  it('appends the detail for tokens that collect one', () => {
    expect(parseEndorsementComment('[worked_together: Acme] solid work')).toEqual({
      relationship: 'Worked together at Acme',
      note: 'solid work',
    });
  });

  it('uses the endorser words as the relationship for "other"', () => {
    expect(parseEndorsementComment('[other: mentor] kind and patient')).toEqual({
      relationship: 'mentor',
      note: 'kind and patient',
    });
  });

  it('drops an unknown token to a null relationship but keeps the note', () => {
    expect(parseEndorsementComment('[mystery] still a note')).toEqual({
      relationship: null,
      note: 'still a note',
    });
  });
});

describe('formatRelationship', () => {
  it('labels each known relationship type', () => {
    expect(formatRelationship('worked_together')).toBe('Worked together');
    expect(formatRelationship('worked_together', 'Acme')).toBe('Worked together at Acme');
    expect(formatRelationship('collaborated_in', 'OSS')).toBe('Collaborated in OSS');
    expect(formatRelationship('supervised_by')).toBe('Manager or mentor relationship');
    expect(formatRelationship('co_authored')).toBe('Co-authored');
    expect(formatRelationship('other', 'mentor')).toBe('mentor');
  });

  it('returns null for an unknown type', () => {
    expect(formatRelationship('nope')).toBeNull();
  });
});
