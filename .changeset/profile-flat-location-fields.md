---
'@singi-labs/sifa-sdk': patch
---

Add optional flat location fields to the `Profile` type (`locationCountry`, `locationRegion`, `locationCity`, `locationLocality`, `countryCode`).

### Why

sifa-api emits these fields at the response root during the additive response window for `community.lexicon.location.address`. The SDK's `Profile` type didn't declare them, forcing consumers (notably sifa-web's profile page and embed JSON route) to cast through `Profile & Partial<{...}>` at every read site. Declaring them on the type retires those casts.

All five fields are marked `@deprecated` with JSDoc and point at the structured `locations[]` array (and the entry with `isPrimary: true`) as the canonical shape. The flat fields stay in the type until sifa-api drops them from the response.

### Type change

```ts
export interface Profile {
  // ...
  location?: LocationValue | null;
  locations?: ProfileLocation[];

  /** @deprecated Prefer locations[].locationCountry */
  locationCountry?: string | null;
  /** @deprecated Prefer locations[].locationRegion */
  locationRegion?: string | null;
  /** @deprecated Legacy alias for locationLocality */
  locationCity?: string | null;
  /** @deprecated Prefer locations[].locationLocality */
  locationLocality?: string | null;
  /** @deprecated Prefer locations[].countryCode */
  countryCode?: string | null;
  // ...
}
```

### Versioning

Patch bump (additive, optional fields).
