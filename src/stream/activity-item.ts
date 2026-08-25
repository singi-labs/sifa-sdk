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
export interface HypercertContributorView {
  displayName: string;
  imageUrl?: string;
  /**
   * Where the contributor lives. A GitHub profile URL on every
   * `contributorInformation` record sampled to date, never a DID or atproto
   * handle, so this does not resolve to a Sifa profile.
   */
  identifier?: string;
  /** Percentage share of the claim; weights across a claim sum to 100. */
  weight?: number;
}

export interface HypercertAttachmentView {
  title?: string;
  url: string;
}

/**
 * Contributor and attachment detail for an `org.hypercerts.claim.activity`
 * record, resolved by sifa-api out of sidecar records in the claim's own repo.
 * A card cannot reach them itself.
 */
export interface HypercertDetailsView {
  contributors: HypercertContributorView[];
  /** Total before truncation, so a renderer can show "+N more". */
  contributorCount: number;
  attachments: HypercertAttachmentView[];
}

/** An account a Certified record points at: a badge recipient, or a group. */
export interface CertifiedActorView {
  did: string;
  /**
   * The account's handle. Falls back to the DID when nothing resolved. Note
   * that some accounts in this ecosystem are not on Bluesky at all (the
   * Hypercerts Foundation's own account resolves only through its DID
   * document), so a Bluesky-only lookup is not sufficient.
   */
  handle: string;
  displayName?: string;
  avatar?: string;
}

/** The badge definition behind an award: what the badge is, and why. */
export interface CertifiedBadgeView {
  title: string;
  /** Why the badge exists, straight from the definition record. */
  description?: string;
  /** Emoji from the definition, e.g. a medal. */
  icon?: string;
  /** e.g. "endorsement", "evaluator". */
  badgeType?: string;
}

/**
 * Certified enrichment, resolved by sifa-api. Covers both directions: a badge
 * the person awarded to someone else, and one they received and accepted.
 */
export interface CertifiedDetailsView {
  badge?: CertifiedBadgeView;
  /** Who received the badge, for an award the person issued. */
  recipient?: CertifiedActorView;
  /** Who issued the badge, for one the person received and accepted. */
  issuer?: CertifiedActorView;
  /** The group joined, for a membership record. */
  group?: CertifiedActorView;
  /** Role on a membership, e.g. "owner", "admin", "member". */
  role?: string;
}

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
  /**
   * The record author's display name, injected by the AppView. Set on `subject`
   * items (the quoted / reposted / replied-to original post) so the nested card
   * can show whose post it is. Absent when unknown.
   */
  authorDisplayName?: string;
  /**
   * The record author's fully-resolved avatar URL, injected by the AppView.
   * Like {@link authorDisplayName}, chiefly set on `subject` items.
   */
  authorAvatar?: string;
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
  /**
   * Hypercert claim enrichment, set by sifa-api. Absent for non-hypercert
   * items, for claims with neither contributors nor attachments, and for
   * responses predating the field.
   */
  hypercertDetails?: HypercertDetailsView;
  /**
   * Certified enrichment: the badge behind an award and the resolved accounts
   * it points at. Absent for non-Certified items and legacy responses.
   */
  certifiedDetails?: CertifiedDetailsView;
}
