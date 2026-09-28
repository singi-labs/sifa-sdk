import { describe, expectTypeOf, it } from 'vitest';
import type { Profile } from './index.js';
import type { AccountVerification } from '../taxonomy/verification-providers.js';
import type { SuggestionProfile } from '../query/fetchers/discovery.js';
import type { ProfileSearchResult } from '../query/fetchers/search.js';
import type { FollowProfile } from '../query/fetchers/follow.js';

// The AppView emits `verificationBadges` (every provider the account is verified
// by, not only Bluesky) on the profile, search, suggestions and follow-list
// responses. The SDK types must declare it so consumers render multi-provider
// badges without casting. (sifa-workspace#260)
describe('verificationBadges', () => {
  it('is declared as optional AccountVerification[] on every card payload', () => {
    expectTypeOf<Profile['verificationBadges']>().toEqualTypeOf<
      AccountVerification[] | undefined
    >();
    expectTypeOf<SuggestionProfile['verificationBadges']>().toEqualTypeOf<
      AccountVerification[] | undefined
    >();
    expectTypeOf<ProfileSearchResult['verificationBadges']>().toEqualTypeOf<
      AccountVerification[] | undefined
    >();
    expectTypeOf<FollowProfile['verificationBadges']>().toEqualTypeOf<
      AccountVerification[] | undefined
    >();
  });
});
