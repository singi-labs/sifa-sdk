---
'@singi-labs/sifa-sdk': patch
---

Add an optional `completedAt` date to Courses (`id.sifa.profile.course`, lexicons 0.9.2). The `ProfileCourseRecordSchema` validates `completedAt` as an optional RFC 3339 datetime, and the `ProfileCourse` read type gains `completedAt`.
