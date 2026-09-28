import { describe, expectTypeOf, it } from 'vitest';

import { addOrgNotificationEmail, submitOrgClaim, verifyOrgDomain } from './org.js';

type AddResult = Awaited<ReturnType<typeof addOrgNotificationEmail>>;
type ClaimResult = Awaited<ReturnType<typeof submitOrgClaim>>;
type VerifyResult = Awaited<ReturnType<typeof verifyOrgDomain>>;

describe('org write results keep the body status and the HTTP status apart', () => {
  it('addOrgNotificationEmail: success carries the send outcome, failure the HTTP status', () => {
    expectTypeOf<Extract<AddResult, { success: true }>['status']>().toEqualTypeOf<
      'verification_sent' | 'sends_paused' | 'send_failed' | undefined
    >();
    expectTypeOf<Extract<AddResult, { success: false }>['status']>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<Extract<AddResult, { success: false }>['retryAfterSeconds']>().toEqualTypeOf<
      number | undefined
    >();
  });

  it('narrows on success without a cast', () => {
    const check = (result: AddResult): void => {
      if (result.success) {
        expectTypeOf(result.status).toEqualTypeOf<
          'verification_sent' | 'sends_paused' | 'send_failed' | undefined
        >();
        expectTypeOf(result.ok).toEqualTypeOf<boolean | undefined>();
      } else {
        expectTypeOf(result.status).toEqualTypeOf<number | undefined>();
        expectTypeOf(result.error).toEqualTypeOf<string | undefined>();
      }
    };
    void check;
  });

  it('submitOrgClaim and verifyOrgDomain keep their body status on success', () => {
    expectTypeOf<Extract<ClaimResult, { success: true }>['status']>().toEqualTypeOf<
      'active' | 'review' | undefined
    >();
    expectTypeOf<Extract<ClaimResult, { success: false }>['status']>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<Extract<VerifyResult, { success: true }>['status']>().toEqualTypeOf<
      'verified' | 'pending' | undefined
    >();
    expectTypeOf<Extract<VerifyResult, { success: false }>['status']>().toEqualTypeOf<
      number | undefined
    >();
  });

  it('body fields stay readable without narrowing', () => {
    expectTypeOf<ClaimResult['orgDid']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AddResult['error']>().toEqualTypeOf<string | undefined>();
  });
});
