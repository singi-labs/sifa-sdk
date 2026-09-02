---
'@singi-labs/sifa-sdk': patch
---

Add per-item activity hide: `hideActivityItem`, `unhideActivityItem` and `fetchHiddenActivityItems` fetchers, the `useHideActivityItem`, `useUnhideActivityItem` and `useHiddenActivityItems` hooks, and the `hidden` flag on `ActivityItem`. Until now activity visibility was controllable at app or category level only, so hiding one off-topic post meant hiding the whole app.
