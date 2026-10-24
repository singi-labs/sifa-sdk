---
'@singi-labs/sifa-sdk': patch
---

JSON Resume: a legacy volunteering record is listed once in `volunteer`, not again from its `involvement` copy. Each `work` entry carries the position's location. Courses taken are certificates with `type: "Courses"` and the course `number`; strict consumers such as altacv refuse those two keys, so strip them before handing the file to one (sifa-api's typeset CV template does).

`formatLocation` no longer prints a trailing comma for a postal code without a country.
