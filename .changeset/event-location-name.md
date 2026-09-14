---
'@singi-labs/sifa-sdk': patch
---

Add a `name` to the `location` Place in presentation Event JSON-LD. The
structured-address branch emitted an `address` with no `name`, which Google
Search Console flags as "Missing field 'name' (in 'location')". The name is
composed from locality, region, and the readable country name (e.g. "Rotterdam,
South Holland, Netherlands").
