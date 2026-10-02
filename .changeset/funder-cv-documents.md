---
'@singi-labs/sifa-sdk': patch
---

Add funder-format CV documents under `/resume`: `profileToFunderCv` maps a profile and a pick of items to an NIH Biographical Sketch or ERC Part B1 CV document, with the funders' item limits in `FUNDER_CV_GROUPS`, a `funderCvSelectionSchema` that enforces them, and helpers to list candidates, pre-select defaults and find picks that are not the profile's own visible records.
