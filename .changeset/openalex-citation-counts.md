---
'@singi-labs/sifa-sdk': patch
---

Add opt-in OpenAlex citation counts: `citationCount` and `openAlexId` on `ProfilePublication` and `PublicationView`, the `openAlexWorkUrl` formatter, and `/api/settings` fetchers and hooks (`fetchUserSettings`, `updateUserSettings`, `useUserSettings`, `useUpdateUserSettings`, `UserSettingsSchema`) including the new `showCitationCounts` preference.
