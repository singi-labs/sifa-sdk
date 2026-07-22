---
'@singi-labs/sifa-sdk': patch
---

Add the `<sifa-badge>` web component under a new `@singi-labs/sifa-sdk/badge` subpath. Drop it into any page (`<script type="module" src="https://esm.sh/@singi-labs/sifa-sdk/badge">` then `<sifa-badge handle="gui.do">`) or `import '@singi-labs/sifa-sdk/badge'` in a bundler to register it. It renders a person's name, current role and employer, and top skills from the public `id.sifa.getProfileView` query, no auth or key required.
