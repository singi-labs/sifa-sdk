---
'@singi-labs/sifa-sdk': patch
---

Add `fetchGivenConfirmations` and `useGivenConfirmations`.

The confirmation inbox lists only claims you have not answered, so once answered there was nowhere to see a confirmation, let alone withdraw it. `revokeConfirmation` shipped in 0.12.46 with no way to reach it.

Each entry carries the name as it stood when confirmed alongside the name the record has now, so a rename shows as a difference rather than being silently overwritten, plus `confirmedStale` and `claimWithdrawn` for the two ways a confirmation stops matching reality.

Revoking now invalidates this list as well as the pending one.
