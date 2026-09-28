---
"@singi-labs/sifa-sdk": patch
---

Fix `buildProfileWorksJsonLd` dropping co-authors and co-members: the JSON-LD works graph overwrote each work's `author`/`member` array with the profile owner reference, so publications with multiple contributors and projects with confirmed members emitted only the owner. It now references only the owner by `@id` and preserves the other contributors as full Person nodes.
