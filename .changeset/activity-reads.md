---
'@singi-labs/sifa-sdk': patch
---

Add activity, endorsement count, and network stream count read endpoints to `@singi-labs/sifa-sdk/query`:

- **Activity:** `fetchHeatmapData` / `useHeatmapData`, `fetchActivityTeaser` / `useActivityTeaser`, `fetchActivityFeed` / `useActivityFeed`. The teaser and feed support `cookieHeader` for RSC server-side calls; the teaser caps upstream wait at 8s so SSR cannot hang.
- **Endorsements:** `fetchEndorsementCount` / `useEndorsementCount` -- count of confirmed endorsements for a DID. Returns 0 on error or unexpected shape.
- **Stream:** `fetchNetworkStreamCount` / `useNetworkStreamCount` -- count of items in the authenticated user's network stream digest. Returns 0 on 404 (the endpoint may not be shipped yet) or any other error.

Plus supporting result types (`HeatmapDay`, `HeatmapResponse`, `ActivityItem`, `ActivityTeaserResponse`, `ActivityFeedResponse`, `FetchActivityTeaserOptions`, `FetchActivityFeedOptions`, `FetchNetworkStreamCountOptions`) and query-key entries (`sifaQueryKeys.activity.*`, `sifaQueryKeys.endorsement.*`, `sifaQueryKeys.stream.*`).

These mirror the existing endpoints in `sifa-web/src/lib/api.ts`. Behavior preserved including the safe-default error contracts (null / 0) and the response-shape guards on the count endpoints.

Part of the Phase 5A.2b sifa-app readiness work. Reactions and roadmap reads follow in subsequent patch releases.
