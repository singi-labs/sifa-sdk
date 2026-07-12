---
"@singi-labs/sifa-sdk": patch
---

Harden the freeform profile date fields. The previous release relaxed them to bare `z.string()`, which accepted any string (including non-dates) for a date field. Route all nine through the shared `partialDateSchema` instead, a validated freeform date that accepts `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or a full datetime and rejects a non-date like `"banana"`. Covers `position.startedAt`/`endedAt`, `project.startedAt`/`endedAt`, `education.startedAt`/`endedAt`, `volunteering.startedAt`/`endedAt`, `certification.issuedAt`/`expiresAt`, `course.completedAt`, `honor.awardedAt`, `publication.publishedAt`, and `involvement.startedAt`/`endedAt` (already on it, now sharing the exported primitive). Each field keeps its optionality (`position.startedAt` stays required). Record-metadata `createdAt` stays a strict datetime.
