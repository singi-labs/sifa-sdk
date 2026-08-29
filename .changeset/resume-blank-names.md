---
'@singi-labs/sifa-sdk': patch
---

Fix two issues in the `/resume` JSON Resume emitter shipped in 0.18.5.

`volunteer[].organization` and `education[].institution` fell back to an empty string when a record carried no usable name, which contradicted the omit-empty contract and renders as a blank organization line in a CV template. Both fields are optional in the emitted document now and the key is omitted instead.

`basics.image` and `basics.profiles[].url` skipped the caller's sanitizer that every other user-authored string passes through, so a consumer supplying DOMPurify got partial coverage.
