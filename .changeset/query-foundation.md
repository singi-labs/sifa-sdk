---
'@singi-labs/sifa-sdk': minor
---

Add the `@singi-labs/sifa-sdk/query` subpath: TanStack Query integration for the Sifa AppView.

**Foundation:**
- `apiFetch` / `apiFetchOrNull` — typed HTTP client with 429 retry, timeout, injectable `fetch`, Next.js cache hints, and `ApiError` for non-2xx
- `SifaProvider` / `useSifaConfig` — React context for SDK configuration (`baseUrl`, optional custom `fetch`)
- `sifaQueryKeys` — hierarchical query key factory rooted under `['sifa', ...]`

**Pilot endpoints (more will be added in subsequent releases as part of the full migration):**
- `fetchProfile` / `useProfile` — read a profile by handle or DID
- `createPosition` / `useCreatePosition` — create a position record, invalidates owner profile cache on success

**Peer dependencies (optional):** `@tanstack/react-query@^5.100.0` and `react@>=19`. The main SDK entry has no React dependency; only the `/query` subpath requires them.

This is the foundation of the query layer for sifa-app and the SDK migration of sifa-web. Subsequent SDK releases will port the remaining ~60 sifa-api endpoints currently called from sifa-web.
