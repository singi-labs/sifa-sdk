---
'@singi-labs/sifa-sdk': patch
---

Add `@singi-labs/sifa-sdk/schemas/write` -- Zod schemas mirroring the input contracts of sifa-api's write endpoints. First step of Phase 4B "plumb first" (workspace #179): give client and server a single source of truth so form-side `.safeParse(...)` promises match server behavior.

## What's exported

```ts
import {
  PositionWriteSchema,
  EducationWriteSchema,
  SkillWriteSchema,
  CertificationWriteSchema,
  ProjectWriteSchema,
  VolunteeringWriteSchema,
  PublicationWriteSchema,
  CourseWriteSchema,
  HonorWriteSchema,
  LanguageWriteSchema,
  ProfileLocationWriteSchema,
  ExternalAccountWriteSchema,
  ProfileSelfWriteSchema,
  // Shared helpers
  writeLocationSchema,
  skillRefSchema,
  normalizeUrl,
  optionalUrl,
  VALID_PLATFORMS,
  type ValidPlatform,
  // Inferred input types (`PositionWriteInput`, etc.)
} from '@singi-labs/sifa-sdk/schemas/write';
```

## Why these are separate from `/schemas`

- `/schemas` (lexicon record schemas) describes the PDS record shape (wire format). Uses `.optional()`, mirrors lexicon constraints (grapheme caps, etc).
- `/schemas/write` describes what sifa-api HTTP endpoints accept. Uses `.nullable()` extensively so API echoes carrying explicit `null` round-trip cleanly. Length caps in **bytes**, not graphemes, matching what the API actually enforces.

Client-side form validation uses `/schemas/write` -- "passes locally" then matches "server accepts." Wire-shape assertions still use `/schemas`.

## Intentional behavior differences from sifa-api's current `schemas.ts`

The rest is verbatim, with **one exception**:

- `PositionWriteSchema.company` is `.nullable().optional()` here; sifa-api currently enforces `z.string().min(1).max(256)` (required). This unblocks the freelancer / independent-employment flow (matches SDK lexicon schema behavior since #184). The sifa-api adoption PR that consumes this schema will therefore be a behavior change -- previously-rejected empty-company writes will succeed.

Awards (`HonorWriteSchema`) and Courses (`CourseWriteSchema`) already have no company field; issuer/institution stay optional.

## Known drift (not addressed here)

`VALID_PLATFORMS` in this module differs from `PLATFORM_LABELS` in `/taxonomy`. `VALID_PLATFORMS` matches sifa-api's `POST /external-accounts` allow-list verbatim (includes `'other'`, omits `bluesky`/`tangled`/`dns`); `PLATFORM_LABELS` is the display taxonomy. Reconciling them is a separate follow-up.

## Versioning

Patch bump. Purely additive -- no changes to existing subpaths.

## Follow-ups

- **sifa-api PR** -- delete local schema definitions in `src/routes/schemas.ts`, import from `@singi-labs/sifa-sdk/schemas/write`. Behavior change: `company` becomes optional on position writes.
- **sifa-web PR** -- rewire `position-edit-dialog.tsx` pilot to use `PositionWriteSchema` instead of `.pick(...)` from the lexicon record schema. Fixes the false-positive/false-negative divergence documented in the Phase 4B decision context.
- **sweep PR(s)** -- workspace #179, per-dialog conversion using the same pattern.
