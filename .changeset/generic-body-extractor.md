---
'@singi-labs/sifa-sdk': patch
---

Extend `toStreamCardVM`'s generic fallback to extract real content. Collections without a typed body variant (Margin, Tangled, KipClip, Grain, asq questions, Semble, Passports fifty-states, Streamplace, and unknown/future apps) now populate `body.text`, `media` (blob refs), `externalLink`, and a reply/quote `subject` from common record shapes, instead of an empty `{ kind: 'generic' }` body. Adds optional `richSegments` (facet-derived spans) and `tags` to the text body variant and `tags` to the media/link/generic variants, with a new `StreamRichSegment` type and `streamRichSegmentSchema`.
