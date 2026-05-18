---
'@singi-labs/sifa-sdk': patch
---

Add profile dimensions logic alongside profile completeness. New exports from the main entry: `countFilledDimensions`, `dimensionsFromInputs`, `profileToDimensionInputs`, `getFilledDimensionsMap`, `MIN_SKILLS`, `DIMENSIONS_MAX_SCORE`, and the supporting types.

This is the canonical source of truth for the 6-key dimension map (avatar, headline, about, currentPosition, skills, education) that the Sifa homepage uses to route between V3 ("building") and V4 ("established") variants. Lives in `src/logic/` next to the existing completeness scoring so both surfaces share one place to evolve.

Existing in-place implementations in `sifa-web/src/lib/profile-dimensions.ts` will migrate to this SDK entry in a follow-up PR; sifa-api will start computing the same number on the session check by importing from the SDK so frontend and backend cannot drift on what "filled" means.

Additive change. No existing exports modified.
