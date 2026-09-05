---
'@singi-labs/sifa-sdk': patch
---

Add `buildProfileHighlights`, the shared selection and labeling logic for the profile "Highlights" block (one ongoing or most-recent record per section: talk, publication, career, education, project, involvement). Consumed by both the sifa-web profile page and the personal-site renderer so the two surfaces feature the same records with the same labels, dates, and co-people. Also exports the `formatSpanDate` / `formatSingleDate` / `formatEventDate` helpers and the `ProfileHighlightTile` / `ProfileHighlightSection` / `ProfileHighlightStatus` / `ProfileHighlightsInput` types.
