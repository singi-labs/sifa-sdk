---
'@singi-labs/sifa-sdk': minor
---

Carry hypercert contributor and attachment detail through the stream card transform.

sifa-api hydrates `hypercertDetails` onto an `ActivityItem`, but `toStreamCardVM` dropped it, so stream cards silently fell back to a bare contributor count while the activity page rendered the full credit roll.

Adds `HypercertDetailsView` (plus its contributor and attachment shapes) to the `ActivityItem` input type and to `StreamCardVM`, validates it in `streamCardVMSchema`, and passes it through the transform before the body-variant switch so every card kind keeps it.

Contributor `identifier` values are GitHub profile URLs in every record sampled, not DIDs, so they do not resolve to Sifa profiles.
