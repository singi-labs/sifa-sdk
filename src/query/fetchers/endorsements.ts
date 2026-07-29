import {
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
} from '../client.js';

/** Body accepted by {@link createEndorsement}. */
export interface EndorsementInput {
  /** DID of the person being endorsed. */
  subjectDid: string;
  /** AT-URI of the subject's `id.sifa.profile.skill` record. */
  skillUri: string;
  /** CID of that skill record, pinning the endorsement to the version endorsed. */
  skillCid: string;
  /**
   * Snapshot of the skill's name at endorsement time. Acts as the validity
   * anchor: if the subject later renames the skill, the mismatch is detectable.
   */
  skillName: string;
  comment?: string;
}

/** Body accepted by {@link confirmEndorsement}. */
export interface ConfirmEndorsementInput {
  endorsementUri: string;
  endorsementCid: string;
}

/**
 * Create an endorsement of another user's skill. The endorsed user
 * must confirm before the endorsement appears on their profile (the
 * endorsement record is on the endorser's PDS; a separate confirmation
 * record on the endorsed user's PDS gates display).
 */
export function createEndorsement(
  config: SifaApiConfig,
  data: EndorsementInput,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/endorsement', data, options);
}

/**
 * Confirm a received endorsement, writing a confirmation record to the
 * signed-in user's PDS. This is what makes the endorsement public: until the
 * confirmation exists, the endorsement is indexed but displays nowhere.
 */
export function confirmEndorsement(
  config: SifaApiConfig,
  data: ConfirmEndorsementInput,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/endorsement/confirm', data, options);
}
