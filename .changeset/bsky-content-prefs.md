---
'@singi-labs/sifa-sdk': patch
---

Add Bluesky content-label preferences support. New fetchers
`fetchBskyContentLabelPrefs` / `updateBskyContentLabelPrefs`, the
`useBskyContentLabelPrefs` / `useUpdateBskyContentLabelPrefs` TanStack
hooks, and the `shouldGateAdultMedia(labels, prefs, isAuthenticated)`
helper that returns the final hide/show decision per post. Used by
sifa-web to honor the viewer's existing Bluesky moderation settings on
Sifa instead of always hiding adult media.
