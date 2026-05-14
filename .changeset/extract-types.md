---
'@singi-labs/sifa-sdk': minor
---

Extract Sifa API response types from `sifa-web` into the SDK. Adds `Profile` and supporting interfaces (positions, education, skills, endorsements, locations, certifications, projects, publications, volunteering, honors, languages, courses, external accounts, trust stats, active apps, feed items, PDS provider info). Also adds the `LanguageProficiency` union and a few extracted nested interfaces (`PublicationContributor`, `ExternalAccountKeytraceClaim`, `ProfileIndustry`, `ProfileOverrideSource`). `SIFA_SDK_VERSION` is now injected at build time from `package.json`.
