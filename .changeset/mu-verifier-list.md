---
'@singi-labs/sifa-sdk': patch
---

Verification providers: mu verifiers now come from Eurosky's published "Trusted verifiers on mu" list (`verifierListUri`). `buildVerifierListMembers` turns listitem records into the member map (rejecting items not written by the list owner), and `resolveVerifierProvider` accepts that map. Without it, the previously confirmed verifiers (`fallbackVerifierDids`) still apply. `AccountVerification` carries an optional `issuerName`.
