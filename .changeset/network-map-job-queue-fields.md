---
"@singi-labs/sifa-sdk": minor
---

Extend `NetworkMapGenerationJob` with optional `position` and `etaSeconds` fields, surfaced by the backend queue + ETA system landing in singi-labs/sifa-api#529.

- `position?: number` — queue rank when the job is still pending and hasn't been picked up by the worker (0 = next to run).
- `etaSeconds?: number` — estimated remaining time, derived from the median historical duration for the user's follow-count bucket.

Both are optional, so consumers built against the previous shape keep working unchanged. Frontends that want to render queue position or ETA can opt in by reading the new fields.
