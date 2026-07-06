---
'@singi-labs/sifa-sdk': patch
---

Talks & sessions CSV import: `normalizePresentationRole` now drops an unrecognized role instead of storing it raw, and maps free-text or compound roles (e.g. "Event host/moderator", "Organizer & co-host/moderator") to the nearest known token by keyword. An organizer-only value has no speaking token and is dropped. This keeps a fixed role dropdown from having to render arbitrary strings, matching `normalizePresentationMode`'s drop-unknown behavior.
