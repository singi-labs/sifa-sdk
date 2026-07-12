---
"@singi-labs/sifa-sdk": patch
---

Relax the user-facing profile date fields to freeform strings so a bare `YYYY-MM` is accepted, matching the lexicons (sifa-lexicons#256). `position.startedAt`/`endedAt`, `project.startedAt`/`endedAt`, `education.startedAt`/`endedAt`, `volunteering.startedAt`/`endedAt`, `certification.issuedAt`/`expiresAt`, `course.completedAt`, `honor.awardedAt`, and `publication.publishedAt` no longer require a strict RFC 3339 datetime. Each field keeps its existing optionality (`position.startedAt` stays required). `involvement` already used a freeform partial-date schema and is unchanged. Record-metadata `createdAt` stays a strict datetime.
