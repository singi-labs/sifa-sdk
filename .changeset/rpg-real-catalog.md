---
'@singi-labs/sifa-sdk': patch
---

rpg: real rpg.actor item catalog (ids, titles, types, image CIDs). Item ids are renamed to match rpg.actor's item cores (`sifa_suit`, `speaker_mic`, `strapped_books`, `dev_hoodie`, `doctoral_cap`, `weekend_shirt`, `lab_coat`); no gifts exist yet, so nothing references the old ids. `RpgItemSchema` gains required `assetCid` and `iconCid`, optional `channels`, and accepts `kind: 'overlay'`.
