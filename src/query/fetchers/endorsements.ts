import {
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
} from '../client.js';

/** Body accepted by {@link createEndorsement}. */
export interface EndorsementInput {
  skillUri: string;
  comment?: string;
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
  return apiWriteCreate(config, '/api/endorsements', data, options);
}
