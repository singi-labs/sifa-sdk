---
'@singi-labs/sifa-sdk': minor
---

Add activity-tier entries for the eight collections the new impact-funding and PinkSea apps scan.

Every collection sifa-api scans needs an entry in `activity-tiers.json`, or `getActivityTier` reports it as `filtered` and sifa-api's taxonomy-reconciliation test fails. All eight are `creation`: hypercert claims, collections, and evaluations; Certified badge awards and memberships; Impact Indexer review comments; and PinkSea oekaki.

Taxonomy version 1.1.0 to 1.2.0.
