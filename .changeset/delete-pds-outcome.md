---
'@singi-labs/sifa-sdk': patch
---

Surface which PDS collections survived a reset or account deletion.

sifa-api now wipes each `id.sifa.*` collection independently and reports the
result, so a delete can partly succeed. `success: true` means the account
action completed, not that the PDS is clean. `resetProfile` and `deleteAccount`
now return `pds: { deleted, remaining, unknown }`, and the hooks are typed to
match. Treat a non-empty `remaining` as "not deleted": without it a UI can only
see `success` and would tell someone their data is gone while it is still on
their data server. `unknown` marks the case where the server could not
enumerate the repo, which is otherwise indistinguishable from "nothing to
delete".
