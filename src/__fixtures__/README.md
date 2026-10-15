# Test fixtures

The anonymized profile responses moved to `src/testing/wire/` and are exported
as `@singi-labs/sifa-sdk/testing`.

- `jsonresume-schema.json`: the JSON Resume schema as vendored by
  gairm-import 0.8.1 (MIT, Shane Murphy), the importer altacv uses. altacv
  rejects any key the schema does not declare, so the emitter is checked
  against it.
