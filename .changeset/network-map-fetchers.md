---
"@singi-labs/sifa-sdk": minor
---

Add `network-map` query fetchers for the personal-network visualization feature (SIF-73).

Exports `initiateNetworkMapGeneration`, `checkNetworkMapJobStatus`, `fetchNetworkMap`, the `isNetworkMapResponse` discriminator, and the supporting types (`NetworkMapNode`, `NetworkMapEdge`, `NetworkMapGraphData`, `NetworkMapResponse`, `NetworkMapGenerationJob`, `NetworkMapPendingJob`). Targets the matching API endpoints in `sifa-api` (singi-labs/sifa-api#527).
