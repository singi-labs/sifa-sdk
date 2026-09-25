---
'@singi-labs/sifa-sdk': patch
---

Add shared search-filter metadata so web and app render the same filters without drift: `SEARCH_FILTER_DEFS` (key/label/control/order/option-source per filter) plus literal English labels for the option taxonomies (`OPEN_TO_OPTIONS.label`, `OPEN_TO_TOKEN_LABELS`, `OPEN_TO_GROUP_LABELS`, `INDUSTRY_LABELS`, `getIndustryLabel`). Labels are canonical for consumers without an i18n layer (the mobile app); the web en.json English must match them.
