---
'@singi-labs/sifa-sdk': patch
---

Add the repo inventory layer: `SIFA_REPO_GROUPS` and `repoGroupForCollection` group `id.sifa.*` collections into user-facing buckets, `describeSifaRecord` turns a raw record into a one-line label without contributing any English of its own, and `fetchRepoInventory` / `deleteRepoRecords` / `repoExportUrl` plus the matching hooks back a repo data-management surface.
