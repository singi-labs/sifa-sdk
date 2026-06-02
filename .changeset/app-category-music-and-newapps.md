---
'@singi-labs/sifa-sdk': minor
---

App-category taxonomy reconciliation with the live sifa-api registry.

- Add **Music** category (`MusicNote` icon).
- Rename `Questions` → `Q&A` to match sifa-api's existing category string.
- Add the 4 apps Sifa onboarded in #137 (`spark`, `nooki`, `atstore`, `plyr`) to `APP_CATEGORY_MAP`.
- Move `passports` from `Social` to `Places` — passports is a travel social network whose activity is fundamentally place-based.

`APP_CATEGORY_MAP` now covers all 30 apps the API registry tracks plus the 4 web-only apps surfaced through sifa-web.
