---
'@singi-labs/sifa-sdk': patch
---

Remove `picosky` from `APP_CATEGORY_MAP`. Picosky shows 0 records across all 1145 tracked Sifa users and `latest_record_at` is NULL — the app is effectively dead. The `Chat` category itself stays in `APP_CATEGORIES` so a future chat-style app can join cleanly.
