---
'@singi-labs/sifa-sdk': patch
---

Add `resolveCardUrl(item)` and `getAppIdForCollection(collection)` helpers, plus the
`APP_URL_PATTERNS` / `COLLECTION_TO_APP` registry, under a new `cards/` module.

`resolveCardUrl` returns the canonical clickable URL for an activity item (the same URL
the sifa-web activity cards render), or `null` when the item is not clickable. This is
the single source of truth that both sifa-web (UI) and sifa-api (the upcoming external
URL health scanner, singi-labs/sifa-workspace#196) will use, so broken-link detection
lines up with what users actually click.

The helper handles the per-collection bespoke URL patterns currently inlined in the card
components: tangled per-repo URLs, kipclip bookmark targets, margin source URLs,
smokesignal RSVP/event uri parsing, standard-document siteUrl+path, and generic
`record.url` fallback, with pattern-based per-item/profile URLs as the final fallback.

No behaviour change for existing consumers — this is additive. sifa-web will migrate to
the helper in a follow-up.
