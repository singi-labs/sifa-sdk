---
'@singi-labs/sifa-sdk': patch
---

Add `SELF_APP_ID` and `excludeSelfApp` for the synthetic Sifa entry in `activeApps`. The AppView injects a Sifa entry into a claimed profile's `activeApps` so external consumers of the public profile data can show Sifa as a platform; first-party surfaces filter it out with `excludeSelfApp`.
