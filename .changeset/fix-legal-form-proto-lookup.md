---
"@singi-labs/sifa-sdk": patch
---

Fix `normalizeLegalForm` crashing on a token that matches an `Object.prototype` member (for example a company name ending in "Constructor", or "__proto__"). The designator lookup now checks own properties, so such tokens are correctly treated as non-designators and returned unchanged.
