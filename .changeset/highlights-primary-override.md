---
'@singi-labs/sifa-sdk': patch
---

Honor the user-flagged primary record in `buildProfileHighlights`. A record flagged `primary` now wins over the automatic latest/soonest pick for talk, publication, education, project, and involvement (via `pickPrimaryFlagged`), matching the profile page's per-section primary toggle. Keeps the shared Highlights builder in sync with the sifa-web behavior so the personal-site renderer honors the same overrides.
