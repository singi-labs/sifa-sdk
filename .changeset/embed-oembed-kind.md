---
'@singi-labs/sifa-sdk': patch
---

resolveEmbed gains an `oembed` result kind for SlideShare and SpeakerDeck public deck URLs (whose iframe src needs a server-side oEmbed lookup), instead of falling back to a plain link. Adds `youtubeVideoId` and `youtubeThumbnailUrl` helpers for deriving a video's poster.
