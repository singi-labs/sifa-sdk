---
'@singi-labs/sifa-sdk': patch
---

Re-export `OPEN_TO_TOKENS`, `OPEN_TO_TOKEN_TO_VALUE`, `OPEN_TO_VALUE_TO_TOKEN`, `openToTokenToValue`, `openToValueToToken`, and `OpenToGroup` from the root SDK barrel. Follow-up to 0.10.8 — these symbols landed in `./taxonomy` but the root barrel did not list them, so consumers importing from `@singi-labs/sifa-sdk` could not reach them.
