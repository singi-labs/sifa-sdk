---
'@singi-labs/sifa-sdk': patch
---

Show what a Margin note annotated. Reads a W3C-annotation `target` (title + http source) as the line's subject, and adds an `annotated` verb (mapped to `at.margin.note` / `at.margin.annotation`), so a Margin line reads "Annotated {page title}" linked to the page instead of a bare "Shared". Generic to any annotation-shaped record.
