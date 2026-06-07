---
'@singi-labs/sifa-sdk': patch
---

Add atmo.rsvp (`quest.atmo.*`), Open Social (`community.opensocial.*`), and Kevara (`is.kevara.*`) to the app category map, URL patterns, and card-URL resolver. atmo.rsvp events link to `/p/{did}/e/{rkey}`; checkins resolve to their referenced event. Open Social memberships fall back to the app profile URL. Kevara is recognized (speaker-directory listings) but has no public web surface yet, so its cards render non-clickable.
