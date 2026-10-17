---
'@singi-labs/sifa-sdk': patch
---

Activity links and timeline filtering:

- Tangled items link to the specific repo (by repo DID, or owner + slug) instead of the owner's profile, and no longer need the author handle. Pulls and issues link to their repo's pulls or issues list; stars link to the starred repo.
- User Input discussions link to their page, and replies link to the discussion they belong to.
- A pckt mini post that replies to another record now reads "Replied to {title}" instead of "Wrote {title}".
- New `isTimelineWorthy(vm)`: true only when an item says concretely what someone did and links to it.
