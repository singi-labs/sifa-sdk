---
'@singi-labs/sifa-sdk': patch
---

Add `limitCombiningMarks` and `sanitizeDisplayText` utilities under `format/`.
Caps stacked Unicode combining marks (Zalgo defence) and strips bidi
formatting controls (LRM/RLM/etc.) from untrusted PDS record text before
rendering, preventing vertical-overflow attacks where a single record can
visually bleed over neighbouring UI.
