---
'@singi-labs/sifa-sdk': patch
---

`course.education` is an at-uri (was a strongRef) and `CourseWriteSchema` accepts it, so any course can link to the Education or Career entry it was part of. `ProfileCourse` and `CourseView` gain `educationRkey`.
