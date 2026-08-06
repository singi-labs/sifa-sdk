---
'@singi-labs/sifa-sdk': patch
---

Add `buildProfileWorksJsonLd`, which returns the publications, talks, courses and projects on a profile as one JSON-LD `@graph`.

These are separate entities rather than properties of the Person, so they belong in their own block. Each node references the Person by `@id` instead of repeating it, which keeps one Person in the graph rather than several partial copies for a consumer to reconcile. Owner-hidden works are excluded, and the function returns null when there is nothing to say so a caller can skip the script block entirely.
