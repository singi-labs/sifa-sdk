---
'@singi-labs/sifa-sdk': patch
---

`profileToJsonResume` fixes:

- **Location:** when there is no usable structured `location` object, it uses the primary entry of `locations` (or the first entry), and otherwise splits a display-string `location` into city and region. The profile API sends `location` as a display string, so resumes built from it had no city, region or country code.
- **Order:** list sections use the same sorts as the profile page and the other exports. Work, education, awards, certificates, publications and projects come newest first (current primary role on top), volunteering current first, and languages by proficiency. Before, they kept record order.

`JsonResumeProfileInput.location` also accepts a string, and the input gains `locations`.
