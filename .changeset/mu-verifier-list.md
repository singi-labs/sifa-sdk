---
'@singi-labs/sifa-sdk': patch
---

Verification providers: mu verifiers now come from Eurosky's published "Trusted verifiers on mu" list (`verifierListUri`) instead of a static DID list. `verifierDids` keeps only the trust root, `resolveVerifierProvider` accepts the loaded list members, and `AccountVerification` carries an optional `issuerName`.
