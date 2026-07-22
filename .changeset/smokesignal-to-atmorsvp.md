---
'@singi-labs/sifa-sdk': patch
---

Point community-calendar event and RSVP card links at atmo.rsvp instead of the retired smokesignal.events. atmo.rsvp resolves any `community.lexicon.calendar` event by did+rkey, so the permalinks transfer 1:1 (`/p/{did}/e/{rkey}`).
