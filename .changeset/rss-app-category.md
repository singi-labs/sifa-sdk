---
'@singi-labs/sifa-sdk': patch
---

Add the `rss` app to APP_CATEGORY_MAP, categorized as Articles. Backs RSS and Atom feed ingestion in sifa-api, whose app registry throws at import when an app id has no category here.
