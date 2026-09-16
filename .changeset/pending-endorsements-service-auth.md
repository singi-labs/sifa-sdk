---
'@singi-labs/sifa-sdk': patch
---

`fetchPendingEndorsements` now attaches a native service-auth Bearer when `config.getAuthToken` is set, so the native app can read its endorsement inbox. Web keeps using its session cookie. Exports `PENDING_ENDORSEMENTS_LXM` (`id.sifa.endorsement.getPending`), which must match the sifa-api endpoint's method binding.
