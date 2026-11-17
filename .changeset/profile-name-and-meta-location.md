---
'@singi-labs/sifa-sdk': patch
---

Person JSON-LD keeps a display name that extends the structured name (for example "Guido X Jansen" with given name "Guido" and family name "Jansen") instead of dropping the middle part. The profile meta description skips a location that formats to an empty string, so it no longer ends in a dangling separator.
