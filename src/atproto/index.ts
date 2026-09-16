/**
 * Direct-to-PDS write helpers for AT Protocol interactions (like, repost, follow,
 * endorsement confirmation).
 *
 * The native app performs OAuth on-device and holds its own authenticated agent,
 * then writes records directly to the user's PDS. These helpers are the shared,
 * typed service layer for those writes: the app passes its agent in, and the SDK
 * never constructs one itself. Reads stay on the sifa-api HTTP client (the rest
 * of this package); this subpath is the write side.
 *
 * Kept dependency-free: the agent is described structurally (below) rather than
 * imported from `@atproto/api`, so consuming this subpath adds no dependency.
 * The app's real `Agent` satisfies the structural type.
 */

/** A strong reference to a record: its AT-URI and content id. */
export interface StrongRef {
  uri: string;
  cid: string;
}

/**
 * The subset of an authenticated AT Protocol agent (e.g. `@atproto/api`'s
 * `Agent`) that these write helpers use. Declared structurally so the SDK needs
 * no `@atproto/api` dependency.
 */
export interface AtprotoWriteAgent {
  like(uri: string, cid: string): Promise<StrongRef>;
  deleteLike(likeUri: string): Promise<void>;
  repost(uri: string, cid: string): Promise<StrongRef>;
  deleteRepost(repostUri: string): Promise<void>;
  follow(subjectDid: string): Promise<StrongRef>;
  deleteFollow(followUri: string): Promise<void>;
}

/**
 * Like a record. `subject` is the post being liked; the returned ref is the
 * like record itself, which {@link unlikeRecord} needs to undo it.
 */
export function likeRecord(agent: AtprotoWriteAgent, subject: StrongRef): Promise<StrongRef> {
  return agent.like(subject.uri, subject.cid);
}

/** Remove a like, given the like record's AT-URI (from {@link likeRecord}). */
export function unlikeRecord(agent: AtprotoWriteAgent, likeUri: string): Promise<void> {
  return agent.deleteLike(likeUri);
}

/**
 * Repost a record. `subject` is the post being reposted; the returned ref is the
 * repost record itself, which {@link unrepostRecord} needs to undo it.
 */
export function repostRecord(agent: AtprotoWriteAgent, subject: StrongRef): Promise<StrongRef> {
  return agent.repost(subject.uri, subject.cid);
}

/** Remove a repost, given the repost record's AT-URI (from {@link repostRecord}). */
export function unrepostRecord(agent: AtprotoWriteAgent, repostUri: string): Promise<void> {
  return agent.deleteRepost(repostUri);
}

/**
 * Follow an actor by DID. The returned ref is the follow record itself, which
 * {@link unfollowUser} needs to undo it.
 */
export function followUser(agent: AtprotoWriteAgent, subjectDid: string): Promise<StrongRef> {
  return agent.follow(subjectDid);
}

/** Unfollow, given the follow record's AT-URI (from {@link followUser}). */
export function unfollowUser(agent: AtprotoWriteAgent, followUri: string): Promise<void> {
  return agent.deleteFollow(followUri);
}

/** Collection NSID (and record `$type`) for an endorsement confirmation. */
const ENDORSEMENT_CONFIRMATION_COLLECTION = 'id.sifa.endorsement.confirmation';

/**
 * The subset of an authenticated agent used to write a record to an arbitrary
 * collection. Convenience methods like {@link AtprotoWriteAgent.like} do not
 * cover custom `id.sifa.*` collections, so those go through `createRecord`.
 * Declared structurally so the SDK needs no `@atproto/api` dependency; the app's
 * real `Agent` satisfies it. `did` is the authenticated repo the record lands in.
 */
export interface AtprotoRecordWriteAgent {
  did?: string;
  com: {
    atproto: {
      repo: {
        createRecord(input: {
          repo: string;
          collection: string;
          record: Record<string, unknown>;
        }): Promise<{ data: { uri: string; cid: string } }>;
      };
    };
  };
}

/**
 * Confirm an endorsement by writing an `id.sifa.endorsement.confirmation` record
 * to the endorsee's own repository. `endorsement` is a strong ref to the
 * endorser's endorsement record. `skill` links the skill this endorsement
 * applies to: pass it when the endorsement proposed a skill the endorsee then
 * created, or when a proposed name matched a skill the endorsee already had (the
 * endorser cannot write to the endorsee's repo, so the skill record is theirs to
 * create and reference). The returned ref is the confirmation record itself.
 */
export async function createEndorsementConfirmation(
  agent: AtprotoRecordWriteAgent,
  input: { endorsement: StrongRef; skill?: StrongRef },
): Promise<StrongRef> {
  if (!agent.did) {
    throw new Error('createEndorsementConfirmation requires an authenticated agent with a did');
  }
  const record: Record<string, unknown> = {
    $type: ENDORSEMENT_CONFIRMATION_COLLECTION,
    endorsement: input.endorsement,
    ...(input.skill ? { skill: input.skill } : {}),
    createdAt: new Date().toISOString(),
  };
  const { data } = await agent.com.atproto.repo.createRecord({
    repo: agent.did,
    collection: ENDORSEMENT_CONFIRMATION_COLLECTION,
    record,
  });
  return { uri: data.uri, cid: data.cid };
}
