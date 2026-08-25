---
'@singi-labs/sifa-sdk': minor
---

Add the `Impact` and `Art` app categories and map four new apps onto the taxonomy.

`APP_CATEGORIES` gains `Impact` (Phosphor `Certificate`) and `Art` (Phosphor `PaintBrush`), and `APP_CATEGORY_MAP` gains four app ids so sifa-api's registry can carry entries for them:

- `hypercerts` → `Impact` — `org.hypercerts.claim.activity`, `org.hypercerts.collection`, `org.hypercerts.claim.evaluation`
- `certified` → `Endorsements` — `app.certified.badge.award` and `app.certified.actor.membership`
- `impactindexer` → `Reviews` — `org.impactindexer.review.comment`
- `pinksea` → `Art` — `com.shinolabs.pinksea.oekaki`
