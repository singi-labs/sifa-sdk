---
'@singi-labs/sifa-sdk': patch
---

Add the verification-providers registry: `VERIFICATION_PROVIDERS`, `resolveVerifierProvider` (firehose issuer gate), `primaryVerification` (single-badge selection), plus `getVerificationProvider`/`isKnownVerificationProvider` and the `VerificationProvider`/`AccountVerification` types. Recognizes Bluesky (API-sourced) and mu/Eurosky (firehose-sourced, gated on a maintained verifier DID list) as trust roots for `app.bsky.graph.verification` records.
