---
'@singi-labs/sifa-sdk': minor
---

Extract pure formatting and parsing helpers from `sifa-web` into the SDK under `src/format/`:

- `formatRelativeTime(dateString)` -- string-based, validates, returns `""` for invalid/future dates, has seconds + years buckets
- `formatDistanceToNow(date: Date)` -- Date-based, returns `"just now"` for sub-minute, has weeks bucket, no years bucket
- `truncateGraphemes(value, maxLen)` -- grapheme-aware truncation with ellipsis, emoji-safe
- `sortByDateDesc(items, extract)` and the four extractors (`dateRangeExtractor`, `lexiconDateExtractor`, `singleDateExtractor`, `certDateExtractor`)
- `formatLocation`, `parseLocationString`, `countryCodeToFlag`
- `sanitizeHandleInput` -- strips `bsky.app/profile/`, `at://`, `@`, http(s)://; appends `.bsky.social` to bare usernames; preserves DIDs
- PDS utilities: `pdsProviderFromApi`, `getHandleStem`, `getDisplayLabel`, `getPdsDisplayName`, `detectPdsProvider`, `PdsProvider` interface
- WCAG contrast helpers: `isValidRgbColor`, `rgbToString`, `relativeLuminance`, `contrastRatio`, `meetsContrastAA`, `RgbColor` interface

The two relative-time formatters are intentionally both exported -- they have different signatures, validation behavior, and output buckets. Picking a unified API is out of scope for this PR.
