---
'@singi-labs/sifa-sdk': patch
---

Add reactions read endpoints to `@singi-labs/sifa-sdk/query`:

- **`fetchReactionStatus` / `useReactionStatus`** -- batch-look up reaction state for multiple URIs. Returns `{}` for an empty input (no network call) and `null` on any error.
- **`checkAppAccount` / `useAppAccountCheck`** -- check whether the authenticated viewer has an account on a given ATproto app. Returns `null` on any error.

Both fetchers support `cookieHeader` for Next.js RSC server-side calls.

Plus supporting result types (`ReactionStatus`, `AccountCheckResult`, `FetchReactionStatusOptions`, `CheckAppAccountOptions`) and query-key entries (`sifaQueryKeys.reactions.*`: `all`, `status`, `accountCheck`).

These mirror the read endpoints in `sifa-web/src/lib/reactions-api.ts`. Behavior preserved including the empty-input shortcut on `fetchReactionStatus` and the safe-default `null` error contract.

Part of the Phase 5A.2b sifa-app readiness work. Roadmap reads follow in the next patch release; reactions mutations land separately in 5A.3.
