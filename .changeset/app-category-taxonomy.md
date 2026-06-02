---
'@singi-labs/sifa-sdk': patch
---

Add app-category taxonomy and appId → category map.

`APP_CATEGORIES` defines 17 internal categories (Articles, Chat, Code, Events, Links, Lists, Pages, Pastes, Photos, Places, Posts, Questions, Research, Reviews, Social, Verification, Video), each pinned to a Phosphor icon name. `APP_CATEGORY_MAP` assigns every tracked AT Protocol app to a category. `categoryForApp(appId)` resolves the category at runtime.

This is the single source of truth that will replace the drifting maps currently scattered across `sifa-api`'s `atproto-app-registry.ts`, `sifa-web`'s `atproto-apps.ts`, and `sifa-web`'s `app-pill.tsx`. sifa-api migrates to consume this in a follow-up PR.
