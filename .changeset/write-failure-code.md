---
'@singi-labs/sifa-sdk': patch
---

Failed writes now carry the API's stable error `code` (for example `CustomDomainRequired`) on the result, when the server sends one.
