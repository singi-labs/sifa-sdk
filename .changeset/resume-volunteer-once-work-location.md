---
'@singi-labs/sifa-sdk': patch
---

JSON Resume: a legacy volunteering record is listed once in `volunteer`, not again from its `involvement` copy. Each `work` entry carries the position's location as `location`, a standard JSON Resume key.

`formatLocation` no longer prints a trailing comma for a postal code without a country.
