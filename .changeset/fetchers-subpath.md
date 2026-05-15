---
'@singi-labs/sifa-sdk': patch
---

Add `@singi-labs/sifa-sdk/query/fetchers` subpath export -- a pure, React-free entry point for Next.js React Server Components, edge runtimes, and any context where hooks are unavailable.

### Why

The existing `/query` barrel bundles both pure fetchers and React-using hooks/Provider into a single output file. tsup's `splitting: false` config means the `'use client'` directives at the per-file level get merged into one big file with no directive, so consuming bundlers (notably Next.js RSC) evaluate the entire module on the server and trip on `createContext` from the Provider.

This subpath exposes only the fetchers + types + the `apiFetch`/`apiWrite` helpers + the `sifaQueryKeys` factory. No React imports. Safe to import from RSC.

### Usage

```ts
// Server Component
import { fetchRoadmapVotes } from '@singi-labs/sifa-sdk/query/fetchers';

const votes = await fetchRoadmapVotes({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
```

Client components continue importing from `@singi-labs/sifa-sdk/query` to get hooks + Provider.

### What's exported

Every fetcher and type from the existing `/query` barrel: profile, profile-mutations, positions (CRUD + skill linking + primary), education, skills, generic records, profile-locations, external-accounts, endorsements, keytrace-claims, publications, stats, apps, search, discovery, follow, activity, endorsement count, network stream, reactions (read + write), quoted posts, roadmap (read + write), destructive ops. Plus `sifaQueryKeys`, `ApiError`, `apiFetch`, `apiFetchOrNull`, `apiWrite`, `apiWriteCreate`, and every related type.

Excluded: `SifaProvider`, `useSifaConfig`, and every `use*` hook.

### Versioning

Patch bump.
