---
'@singi-labs/sifa-sdk': patch
---

`profileToJsonResume` fixes:

- **Location:** when the profile has no structured `location` object, it reads the primary entry of `locations`. The profile API sends `location` as a display string, so resumes built from it had no city, region or country.
- **Order:** work, education, awards, certificates, publications, projects and languages use the same sorts as the profile page and the other exports (newest first, current primary role on top), instead of record order. `JsonResumeProfileInput.location` now also accepts a string, and the input gains `locations`.
