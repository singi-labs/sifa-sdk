---
'@singi-labs/sifa-sdk': patch
---

Remove "Volunteer" from the employment-type dropdown (`EMPLOYMENT_TYPE_GROUPS`). Volunteering is a distinct thing rather than a kind of employment, so it belongs in the dedicated `id.sifa.profile.volunteering` section, not on the employment-type axis. The `id.sifa.defs#volunteer` token stays in `EMPLOYMENT_TYPE_LABELS` so any existing positions carrying it still render a human label instead of the raw NSID.
