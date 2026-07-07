---
'@singi-labs/sifa-sdk': patch
---

Add the organization entity-resolution layer for #159: Zod schemas for the search / select / import-search payloads (`schemas/entity`), the pseudo-employer matcher and disambiguation-display helpers (`logic`), and the query layer — `fetchEntitySearch` / `selectEntity` / `importSearchEntities` fetchers plus the debounced `useEntitySearch` hook and `useSelectEntity` / `useImportSearchEntities` mutations (`query`).
