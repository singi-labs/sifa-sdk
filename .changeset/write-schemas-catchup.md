---
'@singi-labs/sifa-sdk': patch
---

Bring `/schemas/write` into full parity with sifa-api's current `src/routes/schemas.ts` before sifa-api adoption. Extends the subpath shipped in the previous patch with:

## Added shared helpers (`shared.ts`)

- `httpUrlOrNull(input)` -- pure sanitization primitive, returns the string when it's an http(s) URL, else `null`. Blocks `javascript:`, `data:`, etc.
- `isValidDateOnly(input)` -- strict `YYYY-MM-DD` validator, rejects impossible dates (e.g. `2024-02-30`) via round-trip through `Date`.
- `entityRefSchema` -- shared portable-org-identifier field (Wikidata / ROR / LEI / sifa.id URI, http(s) enforced, max 2048).
- `artifactLinkSchema` -- proof link (`id.sifa.defs#artifactLink`).
- `externalRecordRefSchema` -- record reference (`id.sifa.defs#externalRecordRef`, at-uri + optional CID).
- `presentationLinkSchema` -- link attached to a presentation record.

## Added `entityRef` to existing schemas

`PositionWriteSchema`, `EducationWriteSchema`, `CertificationWriteSchema`, `VolunteeringWriteSchema`, `CourseWriteSchema`, `HonorWriteSchema` all now expose an optional `entityRef` field. Consumers that don't send `entityRef` behave identically.

## Extended existing schemas

- `PublicationWriteSchema` gains `subtitle` (`z.string().max(2000).nullable().optional()`).
- `CourseWriteSchema` gains `credential` (at-uri reference to a linked `id.sifa.profile.certification` record) and `completedAt` (RFC 3339 datetime).

## New schemas

- `InvolvementWriteSchema` -- `id.sifa.profile.involvement`. Contribution to an upstream project / community.
- `PresentationWriteSchema` -- `id.sifa.profile.presentation`. A talk the user can give.
- `PresentationDeliveryWriteSchema` -- `id.sifa.profile.presentationDelivery`. A specific delivery of a presentation.
- `OrgProfileWriteSchema` -- Sifa-managed org identity.
- `OrgEmploymentAttestationWriteSchema` -- org-signed statement that a Sifa user held a specific position.

## Tests

Extended `write.test.ts` from 19 -> 38 tests covering the new fields, new schemas, and the two sanitization primitives.

## Versioning

Patch bump. Purely additive: adds fields (all optional) and new exports; no existing exported signatures change.

## Next step

sifa-api adoption PR: replace `src/routes/schemas.ts` local definitions with imports from `@singi-labs/sifa-sdk/schemas/write`. sifa-api's `sanitize.ts` will then re-export `httpUrlOrNull` / `isValidDateOnly` from the SDK too, so any other consumer inside sifa-api keeps working.
