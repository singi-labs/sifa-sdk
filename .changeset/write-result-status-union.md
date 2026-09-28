---
'@singi-labs/sifa-sdk': patch
---

`WriteResult` is now a union discriminated on `success`, so a response body `status` no longer collides with the HTTP `status` added to failed writes in 0.19.54. `WriteResult<TExtra>` takes the body fields as a type argument. On success, `status` has the body type (for example `'verification_sent' | 'sends_paused' | 'send_failed'` for `addOrgNotificationEmail`, `'active' | 'review'` for `submitOrgClaim`, `'verified' | 'pending'` for `verifyOrgDomain`). On failure, `status` is the HTTP status and `retryAfterSeconds` is still available. Narrow on `success` to read either. The exported result types that used to extend `WriteResult` (`CreateResult`, `FollowUserResult`, `ResetProfileResult` and others) are now type aliases with the same names.
