---
'@singi-labs/sifa-sdk': patch
---

Resolve a record-derived activity `sourceUrl` even when the item's uri carries no DID. `resolveSourceUrl` previously bailed whenever `didFromUri` found nothing, which dropped the link on surfaces that key an item by handle (the following feed). A Standard site's URL comes from the record (`siteUrl` + `path`), not the author DID, so it now resolves there too; DID/handle-only patterns (Bluesky permalinks) still yield no link when neither is present.
