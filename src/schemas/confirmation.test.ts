import { describe, expect, it } from 'vitest';

import { ConfirmationRecordSchema, CONFIRMATION_RELATIONS } from './confirmation.js';
import { ProfileProjectRecordSchema } from './profile-project.js';

const validRecord = {
  subject: {
    uri: 'at://did:plc:abc123/id.sifa.profile.project/3kabc',
    cid: 'bafyreib2rxk3rh6kzwq6vwqrzr4wqf3rvvxzs6rlrx3ftbtbfmk4d3fbfe',
  },
  relation: 'id.sifa.defs#projectMember',
  createdAt: '2026-07-31T12:00:00.000Z',
};

describe('ConfirmationRecordSchema', () => {
  it('accepts a minimal confirmation', () => {
    expect(ConfirmationRecordSchema.safeParse(validRecord).success).toBe(true);
  });

  it('accepts a co-speaker confirmation', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      relation: 'id.sifa.defs#coSpeaker',
    });
    expect(parsed.success).toBe(true);
  });

  // The relation is an open set in the lexicon: a consumer that does not
  // recognise a newer relation should still see that someone affirmed
  // something, rather than dropping the record on the floor.
  it('accepts an unrecognised relation', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      relation: 'id.sifa.defs#coAuthor',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a missing subject', () => {
    const { subject: _subject, ...withoutSubject } = validRecord;
    expect(ConfirmationRecordSchema.safeParse(withoutSubject).success).toBe(false);
  });

  it('rejects a subject uri that is not an AT-URI', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      subject: { ...validRecord.subject, uri: 'https://example.com/project' },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a missing relation', () => {
    const { relation: _relation, ...withoutRelation } = validRecord;
    expect(ConfirmationRecordSchema.safeParse(withoutRelation).success).toBe(false);
  });

  it('rejects a createdAt without an offset', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      createdAt: '2026-07-31',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts an optional subjectName snapshot', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      subjectName: 'Sifa AppView',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a subjectName over 300 graphemes', () => {
    const parsed = ConfirmationRecordSchema.safeParse({
      ...validRecord,
      subjectName: 'x'.repeat(301),
    });
    expect(parsed.success).toBe(false);
  });

  it('exports the two shipped relations', () => {
    expect(CONFIRMATION_RELATIONS).toEqual([
      'id.sifa.defs#coSpeaker',
      'id.sifa.defs#projectMember',
    ]);
  });
});

describe('ProfileProjectRecordSchema members', () => {
  const base = { name: 'Sifa', createdAt: '2026-07-31T12:00:00.000Z' };

  it('accepts a record with no members', () => {
    expect(ProfileProjectRecordSchema.safeParse(base).success).toBe(true);
  });

  it('accepts members with only a did', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      members: [{ did: 'did:plc:abc123' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts a role and title', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      members: [
        { did: 'did:plc:abc123', role: 'id.sifa.defs#projectCore', title: 'Backend Engineer' },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a member without a did', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      members: [{ role: 'id.sifa.defs#projectCore' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a member did that is not a DID', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      members: [{ did: 'alice.bsky.social' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a 51st member', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      members: Array.from({ length: 51 }, (_, i) => ({ did: `did:plc:abc${i}` })),
    });
    expect(parsed.success).toBe(false);
  });

  // The lexicon allows 256 graphemes. The SDK previously capped at 100, which
  // silently rejected records a conforming PDS had already accepted.
  it('accepts a name up to the lexicon limit of 256 graphemes', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({ ...base, name: 'x'.repeat(256) });
    expect(parsed.success).toBe(true);
  });

  it('accepts a projectRef pointing at another persons project', () => {
    const parsed = ProfileProjectRecordSchema.safeParse({
      ...base,
      projectRef: {
        uri: 'at://did:plc:other/id.sifa.profile.project/3kxyz',
        cid: 'bafyreib2rxk3rh6kzwq6vwqrzr4wqf3rvvxzs6rlrx3ftbtbfmk4d3fbfe',
      },
    });
    expect(parsed.success).toBe(true);
  });
});
