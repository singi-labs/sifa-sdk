---
'@singi-labs/sifa-sdk': patch
---

Add `streamCardContent` (plus `streamCardBodyContent` and `streamCardSubjectText`) to the stream module: the shared extraction of a stream card's real content string (an article title, a venue, an annotated page) and its link, so clients render the title next to the verb instead of the verb alone. Ports the logic web kept locally so web and app cannot drift.
