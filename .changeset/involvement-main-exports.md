---
'@singi-labs/sifa-sdk': patch
---

Re-export the involvement symbols from the package's main entry. `ProfileInvolvement` / `ProfileInvolvementLink`, the `involvementKind` and `artifactLink.kind` taxonomies (`getInvolvementKindHeading`, `INVOLVEMENT_KIND_OPTIONS`, `getArtifactLinkKindLabel`, …), and `ProfileInvolvementRecordSchema` / `ArtifactLinkSchema` / `PROFILE_INVOLVEMENT_NSID` reached the `/schemas` and `/query` subpaths but not the curated main index, so importing them from `@singi-labs/sifa-sdk` failed. They are now on the main entry alongside the other profile sections.
