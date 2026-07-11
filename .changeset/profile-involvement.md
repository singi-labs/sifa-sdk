---
'@singi-labs/sifa-sdk': patch
---

Add `id.sifa.profile.involvement` support: `ProfileInvolvementRecordSchema` and `ArtifactLinkSchema` (both `.passthrough()` for co-writer forward-compat), the `involvementKind` and `artifactLink.kind` taxonomies (with a kind-to-heading map), the `ProfileInvolvement` / `ProfileInvolvementLink` read types with the rung-2 verification signal, and `involvement` on `Profile`. Records are written through the existing generic record hooks (`useCreateRecord` / `useUpdateRecord` / `useDeleteRecord`) with `PROFILE_INVOLVEMENT_NSID`, and read back on the aggregate profile query.
