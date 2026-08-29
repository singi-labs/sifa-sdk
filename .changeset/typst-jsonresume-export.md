---
'@singi-labs/sifa-sdk': patch
---

Add a `@singi-labs/sifa-sdk/resume` subpath that emits JSON Resume v1.0.0 from a Sifa profile.

`profileToJsonResume(profile, options)` is a pure mapper with no fetching and no DOM, alongside the existing JSON-LD emitter. Hidden records are dropped, keys are omitted rather than emitted empty, and dates are trimmed to the `YYYY`/`YYYY-MM`/`YYYY-MM-DD` forms JSON Resume accepts. Fields with no JSON Resume counterpart (endorsements, confirmations, involvement, investments, presentations, courses) are dropped rather than smuggled into a nearby field.

Unlocks CV tooling that already consumes JSON Resume, including the Typst CV templates on Typst Universe.
