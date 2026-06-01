import { describe, expect, it } from 'vitest';

import {
  AtmosphereFeedItemSchema,
  FollowFeedItemSchema,
  FollowFeedPageSchema,
  SifaFeedItemSchema,
  decodeFeedCursor,
  encodeFeedCursor,
  type FeedCursor,
} from './feed.js';
import { GraphFollowRecordSchema, makeGraphFollowRecordSchema } from './graph-follow.js';

const NOW = '2026-06-01T10:00:00.000Z';
const DID_A = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';
const DID_B = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';

describe('GraphFollowRecordSchema', () => {
  it('accepts a minimal record', () => {
    expect(GraphFollowRecordSchema.safeParse({ subject: DID_A, createdAt: NOW }).success).toBe(
      true,
    );
  });

  it('accepts an optional note within 200 graphemes', () => {
    expect(
      GraphFollowRecordSchema.safeParse({
        subject: DID_A,
        createdAt: NOW,
        note: 'long-time collaborator',
      }).success,
    ).toBe(true);
  });

  it('rejects a note longer than 200 graphemes', () => {
    expect(
      GraphFollowRecordSchema.safeParse({
        subject: DID_A,
        createdAt: NOW,
        note: 'a'.repeat(201),
      }).success,
    ).toBe(false);
  });

  it('rejects invalid DID subject', () => {
    expect(
      GraphFollowRecordSchema.safeParse({ subject: 'not-a-did', createdAt: NOW }).success,
    ).toBe(false);
  });

  it('rejects malformed createdAt', () => {
    expect(
      GraphFollowRecordSchema.safeParse({ subject: DID_A, createdAt: '2026-06-01' }).success,
    ).toBe(false);
  });
});

describe('makeGraphFollowRecordSchema (self-follow guard)', () => {
  it('rejects records where subject equals follower', () => {
    const schema = makeGraphFollowRecordSchema(DID_A);
    const result = schema.safeParse({ subject: DID_A, createdAt: NOW });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/self-follow/i);
      expect(result.error.issues[0]?.path).toEqual(['subject']);
    }
  });

  it('accepts records where subject differs from follower', () => {
    const schema = makeGraphFollowRecordSchema(DID_A);
    expect(schema.safeParse({ subject: DID_B, createdAt: NOW }).success).toBe(true);
  });
});

describe('FeedItem schemas', () => {
  const actor = { did: DID_A, handle: 'alice.bsky.social' };

  it('SifaFeedItemSchema accepts a profile-update event', () => {
    expect(
      SifaFeedItemSchema.safeParse({
        id: '1',
        source: 'sifa',
        actor,
        indexedAt: NOW,
        eventType: 'profile.position.created',
        payload: { rkey: '3kabc' },
      }).success,
    ).toBe(true);
  });

  it('AtmosphereFeedItemSchema accepts a Barazo post event', () => {
    expect(
      AtmosphereFeedItemSchema.safeParse({
        id: '2',
        source: 'atmosphere',
        actor,
        indexedAt: NOW,
        eventType: 'post.create',
        appId: 'barazo',
        uri: 'at://did:plc:abcdefghijklmnopqrstuvwx/forum.barazo.post/3kabc',
        payload: { $type: 'app.bsky.embed.record#view', record: {} },
      }).success,
    ).toBe(true);
  });

  it('FollowFeedItemSchema discriminates by source', () => {
    const parsed = FollowFeedItemSchema.parse({
      id: '3',
      source: 'sifa',
      actor,
      indexedAt: NOW,
      eventType: 'profile.skill.created',
      payload: {},
    });
    expect(parsed.source).toBe('sifa');
  });

  it('FollowFeedItemSchema rejects unknown source', () => {
    expect(
      FollowFeedItemSchema.safeParse({
        id: '4',
        source: 'lemmy',
        actor,
        indexedAt: NOW,
        eventType: 'x',
        payload: {},
      }).success,
    ).toBe(false);
  });

  it('FollowFeedPageSchema accepts an empty page', () => {
    expect(FollowFeedPageSchema.safeParse({ items: [], cursor: null }).success).toBe(true);
  });
});

describe('Feed cursor encode/decode', () => {
  it('round-trips a sifa cursor', () => {
    const cursor: FeedCursor = { indexedAt: NOW, source: 'sifa', id: '42' };
    const encoded = encodeFeedCursor(cursor);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    expect(decodeFeedCursor(encoded)).toEqual(cursor);
  });

  it('round-trips an atmosphere cursor', () => {
    const cursor: FeedCursor = { indexedAt: NOW, source: 'atmosphere', id: 'abc-def' };
    expect(decodeFeedCursor(encodeFeedCursor(cursor))).toEqual(cursor);
  });

  it('rejects a tampered cursor', () => {
    expect(() => decodeFeedCursor('not-base64!!!')).toThrow();
  });

  it('rejects a cursor with an invalid source', () => {
    // Build a payload with the wrong shape and confirm decode rejects it.
    const bad = Buffer.from(
      JSON.stringify({ indexedAt: NOW, source: 'wrong', id: '1' }),
      'utf-8',
    ).toString('base64url');
    expect(() => decodeFeedCursor(bad)).toThrow();
  });
});
