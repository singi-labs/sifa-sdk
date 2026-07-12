---
"@singi-labs/sifa-sdk": patch
---

Relax the five drifted profile date fields to freeform strings so a bare `YYYY-MM` is accepted. `volunteering.startedAt`/`endedAt`, `certification.issuedAt`/`expiresAt`, `course.completedAt`, `honor.awardedAt`, and `publication.publishedAt` no longer require a strict RFC 3339 datetime, matching the relaxed lexicons (sifa-lexicons#256) and the way position, project, education, and involvement already document these dates. Record-metadata `createdAt` stays a strict datetime.
