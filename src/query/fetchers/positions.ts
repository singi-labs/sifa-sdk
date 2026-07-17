import type { ProfilePosition, SkillRef } from '../../types/index.js';
import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

export type { CreateResult, WriteResult } from '../client.js';

/**
 * Create a new `id.sifa.profile.position` record on the authenticated
 * user's PDS. The AppView signs and writes via the user's OAuth session.
 *
 * `data` should be a lexicon-shaped position record (without `createdAt`
 * or `rkey`; the AppView fills both). Validate with
 * `ProfilePositionRecordSchema.omit({ createdAt: true })` before calling
 * if you want client-side guarantees.
 *
 * Never throws -- inspect `result.success` and use `result.error` /
 * `result.pdsHost` for UI messaging.
 */
export function createPosition(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/position', data, options);
}

/** Update an existing position by `rkey`. */
export function updatePosition(
  config: SifaApiConfig,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/position/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete a position by `rkey`. */
export function deletePosition(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/position/${encodeURIComponent(rkey)}`, 'DELETE', options);
}

/** Mark a position as the user's primary (current) role. */
export function setPositionPrimary(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/position/${encodeURIComponent(rkey)}/primary`,
    'PUT',
    options,
  );
}

/** Clear the "primary" flag on a position. */
export function unsetPositionPrimary(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/position/${encodeURIComponent(rkey)}/primary`,
    'DELETE',
    options,
  );
}

/**
 * Build the PUT-body for a position update. Strips `null` `location`
 * (so JSON.stringify drops it) and includes the provided `skills` list.
 */
function buildPositionPayload(
  position: ProfilePosition,
  skills: SkillRef[],
): Record<string, unknown> {
  return {
    company: position.company,
    title: position.title,
    description: position.description,
    startedAt: position.startedAt,
    endedAt: position.endedAt,
    location: position.location ?? undefined,
    // Carry the form-controlled optional fields the AppView merge would
    // otherwise clear when absent from the PUT body. Omitting them here made
    // every link/unlink strip employmentType, workplaceType, and entityRef
    // off the position (id.sifa.profile.position#skills round-trip).
    employmentType: position.employmentType,
    workplaceType: position.workplaceType,
    entityRef: position.entityRef,
    skills,
  };
}

/**
 * Add a skill link to a position. Idempotent: if the skill is already
 * linked, resolves to `{ success: true }` without a network call.
 *
 * Implementation note: the AppView only exposes whole-record PUTs, so
 * this helper rebuilds the position body with the new skills list.
 */
export function linkSkillToPosition(
  config: SifaApiConfig,
  position: ProfilePosition,
  skillRef: SkillRef,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  const currentSkills = position.skills ?? [];
  if (currentSkills.some((s) => s.uri === skillRef.uri)) {
    return Promise.resolve({ success: true });
  }
  return updatePosition(
    config,
    position.rkey,
    buildPositionPayload(position, [...currentSkills, skillRef]),
    options,
  );
}

/** Remove a skill link from a position. */
export function unlinkSkillFromPosition(
  config: SifaApiConfig,
  position: ProfilePosition,
  skillRef: SkillRef,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  const remaining = (position.skills ?? []).filter((s) => s.uri !== skillRef.uri);
  return updatePosition(config, position.rkey, buildPositionPayload(position, remaining), options);
}
