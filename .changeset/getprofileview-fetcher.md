---
'@singi-labs/sifa-sdk': patch
---

Add `fetchGetProfileView` fetcher, `useGetProfileView` hook, and `ProfileView` types for the new `id.sifa.getProfileView` XRPC query. Reads the aggregated public profile view (positions, education, skills, endorsements, and more) that a Sifa AppView serves as a standard lexicon method. Returns `null` when the actor has no profile (`ProfileNotFound`).
