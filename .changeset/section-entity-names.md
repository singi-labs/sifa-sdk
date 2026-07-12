---
'@singi-labs/sifa-sdk': patch
---

Add `entityName` to the education, certification, volunteering, honor, and course profile read types, matching positions and involvement. The AppView resolves the durably-linked organization's current canonical name at read time, so a name correction reaches every linked profile without a PDS write.
