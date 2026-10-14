# Test fixtures

- `wire/*.json`: real profile responses from the public Sifa API, anonymized by
  `scripts/refresh-wire-fixtures.mjs`. They keep the shape the API sends
  (string `location` plus `locations[]`, linked accounts, storage order) and
  drop all personal text. Refresh with `pnpm fixtures:wire`.
- `jsonresume-schema.json`: the JSON Resume schema as vendored by
  gairm-import 0.8.1 (MIT, Shane Murphy), the importer altacv uses. altacv
  rejects any key the schema does not declare, so the emitter is checked
  against it.
