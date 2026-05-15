---
'@singi-labs/sifa-sdk': patch
---

Add stats, apps registry, hidden apps, and AT Fund link read endpoints to `@singi-labs/sifa-sdk/query`:

- **Stats:** `fetchStats` / `useStats` -- public homepage stats (profile count, avatar samples, ATproto growth metrics).
- **Apps:** `fetchAppsRegistry` / `useAppsRegistry` (public catalog of ATproto apps surfaced by Sifa), `fetchHiddenApps` / `useHiddenApps` (the authenticated user's hidden-apps list, with optional `cookieHeader` for RSC server-side calls).
- **Profile:** `fetchAtFundLink` / `useAtFundLink` -- profile's AT Fund link, indexed by DID.

Plus supporting result types (`StatsResponse`, `AppRegistryEntry`, `HiddenApp`, `FetchHiddenAppsOptions`) and query-key entries (`sifaQueryKeys.stats.*`, `sifaQueryKeys.apps.*`, `sifaQueryKeys.profile.atFundLink`).

These mirror the existing endpoints in `sifa-web/src/lib/api.ts`. Behavior preserved including the safe-default error contracts (null / empty array) and the `cookieHeader` forwarding pattern for Next.js RSC server-side calls.

Part of the Phase 5A.2b sifa-app readiness work. Remaining read endpoints (activity, reactions, roadmap) follow in subsequent patch releases; mutations land separately.
