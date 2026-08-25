---
'@singi-labs/sifa-sdk': minor
---

Add the `Impact` app category and map the impact-funding apps onto the taxonomy.

`APP_CATEGORIES` gains `Impact` (Phosphor `Certificate`), and `APP_CATEGORY_MAP` gains three app ids so sifa-api's registry can carry entries for them:

- `hypercerts` → `Impact` — `org.hypercerts.claim.activity` and `org.hypercerts.collection`
- `certified` → `Endorsements` — `app.certified.badge.award` and `app.certified.actor.membership`
- `impactindexer` → `Reviews` — `org.impactindexer.review.comment`
