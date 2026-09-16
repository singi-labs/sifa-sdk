import { describe, expect, it, vi } from 'vitest';

import {
  type AtprotoRecordWriteAgent,
  type AtprotoWriteAgent,
  createEndorsementConfirmation,
  followUser,
  likeRecord,
  repostRecord,
  unfollowUser,
  unlikeRecord,
  unrepostRecord,
} from './index';

function makeAgent() {
  return {
    like: vi.fn(() => Promise.resolve({ uri: 'at://me/app.bsky.feed.like/1', cid: 'likecid' })),
    deleteLike: vi.fn(() => Promise.resolve()),
    repost: vi.fn(() =>
      Promise.resolve({ uri: 'at://me/app.bsky.feed.repost/1', cid: 'repostcid' }),
    ),
    deleteRepost: vi.fn(() => Promise.resolve()),
    follow: vi.fn(() =>
      Promise.resolve({ uri: 'at://me/app.bsky.graph.follow/1', cid: 'followcid' }),
    ),
    deleteFollow: vi.fn(() => Promise.resolve()),
  } satisfies AtprotoWriteAgent;
}

const POST = { uri: 'at://author/app.bsky.feed.post/1', cid: 'postcid' };

describe('atproto write helpers', () => {
  it('likeRecord likes the subject and returns the like record ref', async () => {
    const agent = makeAgent();
    const ref = await likeRecord(agent, POST);
    expect(agent.like).toHaveBeenCalledWith(POST.uri, POST.cid);
    expect(ref).toEqual({ uri: 'at://me/app.bsky.feed.like/1', cid: 'likecid' });
  });

  it('unlikeRecord deletes the like by its uri', async () => {
    const agent = makeAgent();
    await unlikeRecord(agent, 'at://me/app.bsky.feed.like/1');
    expect(agent.deleteLike).toHaveBeenCalledWith('at://me/app.bsky.feed.like/1');
  });

  it('repostRecord reposts the subject and returns the repost record ref', async () => {
    const agent = makeAgent();
    const ref = await repostRecord(agent, POST);
    expect(agent.repost).toHaveBeenCalledWith(POST.uri, POST.cid);
    expect(ref).toEqual({ uri: 'at://me/app.bsky.feed.repost/1', cid: 'repostcid' });
  });

  it('unrepostRecord deletes the repost by its uri', async () => {
    const agent = makeAgent();
    await unrepostRecord(agent, 'at://me/app.bsky.feed.repost/1');
    expect(agent.deleteRepost).toHaveBeenCalledWith('at://me/app.bsky.feed.repost/1');
  });

  it('followUser follows the DID and returns the follow record ref', async () => {
    const agent = makeAgent();
    const ref = await followUser(agent, 'did:plc:someone');
    expect(agent.follow).toHaveBeenCalledWith('did:plc:someone');
    expect(ref).toEqual({ uri: 'at://me/app.bsky.graph.follow/1', cid: 'followcid' });
  });

  it('unfollowUser deletes the follow by its uri', async () => {
    const agent = makeAgent();
    await unfollowUser(agent, 'at://me/app.bsky.graph.follow/1');
    expect(agent.deleteFollow).toHaveBeenCalledWith('at://me/app.bsky.graph.follow/1');
  });
});

type CreateRecordInput = {
  repo: string;
  collection: string;
  record: Record<string, unknown>;
};

function makeRecordAgent(did?: string) {
  const createRecord = vi.fn((_input: CreateRecordInput) =>
    Promise.resolve({
      data: { uri: 'at://me/id.sifa.endorsement.confirmation/1', cid: 'confirmcid' },
    }),
  );
  const agent = {
    did,
    com: { atproto: { repo: { createRecord } } },
  } satisfies AtprotoRecordWriteAgent;
  return { agent, createRecord };
}

function firstCall(createRecord: { mock: { calls: [CreateRecordInput][] } }): CreateRecordInput {
  const input = createRecord.mock.calls[0]?.[0];
  if (!input) throw new Error('createRecord was not called');
  return input;
}

const ENDORSEMENT = { uri: 'at://endorser/id.sifa.endorsement/1', cid: 'endorsecid' };
const SKILL = { uri: 'at://me/id.sifa.profile.skill/1', cid: 'skillcid' };

describe('createEndorsementConfirmation', () => {
  it('writes a confirmation record to the endorsee repo and returns its ref', async () => {
    const { agent, createRecord } = makeRecordAgent('did:plc:me');
    const ref = await createEndorsementConfirmation(agent, { endorsement: ENDORSEMENT });
    expect(createRecord).toHaveBeenCalledTimes(1);
    const input = firstCall(createRecord);
    expect(input.repo).toBe('did:plc:me');
    expect(input.collection).toBe('id.sifa.endorsement.confirmation');
    expect(input.record.$type).toBe('id.sifa.endorsement.confirmation');
    expect(input.record.endorsement).toEqual(ENDORSEMENT);
    expect(typeof input.record.createdAt).toBe('string');
    expect(Number.isNaN(Date.parse(input.record.createdAt as string))).toBe(false);
    expect(ref).toEqual({
      uri: 'at://me/id.sifa.endorsement.confirmation/1',
      cid: 'confirmcid',
    });
  });

  it('omits skill when not provided', async () => {
    const { agent, createRecord } = makeRecordAgent('did:plc:me');
    await createEndorsementConfirmation(agent, { endorsement: ENDORSEMENT });
    expect(firstCall(createRecord).record).not.toHaveProperty('skill');
  });

  it('links skill when provided', async () => {
    const { agent, createRecord } = makeRecordAgent('did:plc:me');
    await createEndorsementConfirmation(agent, { endorsement: ENDORSEMENT, skill: SKILL });
    expect(firstCall(createRecord).record.skill).toEqual(SKILL);
  });

  it('throws when the agent has no did', async () => {
    const { agent } = makeRecordAgent();
    await expect(
      createEndorsementConfirmation(agent, { endorsement: ENDORSEMENT }),
    ).rejects.toThrow(/did/i);
  });
});
