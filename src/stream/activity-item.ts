/**
 * The activity envelope the AppView emits and the SDK transform consumes.
 *
 * This mirrors the public fields of `sifa-api`'s `ActivityItem`
 * (`src/routes/activity/types.ts`) so the SDK never depends on the private
 * api package. Only the fields the shared view-model transform reads are
 * modelled here; api-only enrichments (quoted-post resolution, standard-site
 * embeds, content labels) are layered on in sifa-web and are not part of the
 * shared contract.
 */
export interface ActivityItem {
  /** Full at-uri of the record: stable key + permalink source. */
  uri: string;
  /** Content identifier of the record version. */
  cid: string;
  /** Collection NSID, e.g. `app.bsky.feed.post`. */
  collection: string;
  /** Record key. */
  rkey: string;
  /** The raw record from the PDS / AppView. Parsed defensively by the transform. */
  record: unknown;
  /**
   * The record author's handle, injected by the AppView. The activity snapshot
   * is per-author, so the api sets this per item (and per `subject` item) to let
   * handle-keyed apps (Bluesky, Popfeed, Tangled, ...) resolve a `sourceUrl`.
   * Absent when the handle is unknown; the transform then relies on the DID.
   */
  authorHandle?: string;
  /** App id from the app registry, e.g. `bluesky`. */
  appId: string;
  /** Human app name from the app registry, e.g. `Bluesky`. */
  appName: string;
  /** App category from the app registry, e.g. `Posts`. */
  category: string;
  /** When the AppView indexed the record (ISO 8601). */
  indexedAt: string;
  /**
   * Repost / reply target, hydrated by the AppView. When present it is
   * normalized recursively through the same transform so a card's subject is
   * a `StreamCardVM` too.
   */
  subject?: ActivityItem;
}
