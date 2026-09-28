## Problem

The newer-build notice on the web homepage and the app's Following tab offered "Newer activity from your network" that showed nothing new. `isNewerFollowingFeed` compared build times only, and a background rebuild usually finds the same items with a newer `builtAt`.

## What

- **Types:** `FollowingFeedResponse` gains `contentHash`, and `FollowingFeedVersion` is now `{ builtAt, contentHash }`. The fingerprint comes from singi-labs/sifa-api#1475.
- **`isNewerFollowingFeed(shown, latest)`** takes the two builds and is only true when the newer build also shows different items. If either side has no fingerprint (a feed cached before the API change), it is false: better to miss an offer than to make an empty one.
- **`useFollowingFeedVersion`** returns the version object instead of only `builtAt`.
- **New type `FollowingFeedBuild`**, exported from `/query` and `/query/fetchers`.

The signature and return-type changes only affect code shipped today (sifa-web#2199, sifa-app#54). Both are updated right after this release.

## Tests

- `isNewerFollowingFeed`: a newer build with different items, a newer build with the same items, a same or older build, and missing data.
- The fetcher and the hook return both fields.
- Full suite: 2205 passed. `check:dist` passes.

Refs singi-labs/sifa-workspace#600
