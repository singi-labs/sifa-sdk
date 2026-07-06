---
'@singi-labs/sifa-sdk': patch
---

Add co-speaker support to presentation deliveries: a `coSpeakers` field (DIDs) on the delivery write schema, a hydrated `CoSpeaker` view-model on `ProfilePresentationDelivery`, and `fetchResolveActor` to resolve any atproto handle (or DID) to a profile card for the co-speaker picker.
