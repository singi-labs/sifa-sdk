import { describe, expect, it, vi } from 'vitest';

import {
  type AtprotoWriteAgent,
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
