---
'@singi-labs/sifa-sdk': patch
---

`resolveCardUrl` now absorbs two URL-correctness guards that previously lived only in
sifa-web. Both prevent broken URLs that would 404 when users click activity cards (and
when the upcoming sifa-api scanner HEAD-checks them):

- **Bluesky collection guard** (sifa-web#1070 / sifa-web#1073): the per-item URL
  `https://bsky.app/profile/{handle}/post/{rkey}` is only valid for
  `app.bsky.feed.post`. Other `app.bsky.*` collections (`actor.status` with
  `rkey=self`, `graph.cancellation`, etc.) now fall back to the profile URL.

- **Tangled repo-slug validation** (sifa-web#1071 / sifa-web#1072): multi-segment
  aggregate `record.name` values (whitespace, slashes, special chars) now fall back
  to the profile URL instead of producing 404 URLs like
  `https://tangled.sh/{handle}/atproto-snake%20azurite%20...`.

These were just shipped in sifa-web as local fixes. Moving them into the SDK is a
prerequisite for the sifa-web migration (singi-labs/sifa-workspace#196 PR 2) and the
sifa-api scanner (PR 3) — all three call-sites need the same guards or broken-link
detection drifts from what users actually click.

No behaviour change for existing consumers — the guards only trim outputs that were
already broken.
