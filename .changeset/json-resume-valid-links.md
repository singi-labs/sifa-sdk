---
'@singi-labs/sifa-sdk': patch
---

`profileToJsonResume` emits every link field (website, linked accounts, certificates, publications, projects) as a valid URI. A bare domain such as `example.com` gets `https://`, and a value that is not a link is left out. JSON Resume declares these fields as URIs, and altacv refused the whole typeset CV when one was not.
