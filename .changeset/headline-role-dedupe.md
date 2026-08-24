---
'@singi-labs/sifa-sdk': patch
---

Add `isRoleLineRedundant(headline, roleLine)` profile predicate. Lets surfaces suppress the derived "{title} at {company}" line when it merely repeats the freeform headline (common after LinkedIn import), preventing a doubled tagline.
