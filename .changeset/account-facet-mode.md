---
'@singi-labs/sifa-sdk': patch
---

Add the three-way account facet mode: person, company, or both.

- `Profile.renderPreference` -- the Sifa-local override the api already returns but the type omitted.
- `resolveAccountFacetMode(profile)` -- resolves the settings switch's three-way answer from its two storage layers (local override, portable PDS declaration).
- `rendersCompanyProfile(org, renderPreference)` -- the mirror of `rendersPersonalProfile`; an explicit person choice now suppresses the `/c/` page instead of only suppressing recognition.
- `rendersPersonalProfile` takes an optional `renderPreference`, so a person choice renders `/p/` even for an account holding an org record.
