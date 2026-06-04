/**
 * URL patterns per app, mirroring the sifa-web registry.
 *
 * These describe how to build a clickable URL for an activity card given
 * the author's handle/did and the record rkey. The patterns are templates
 * with `{handle}`, `{did}`, and `{rkey}` placeholders; each variable is
 * URI-encoded when interpolated.
 *
 * Tier semantics:
 * - `urlPattern`: per-item URL (a specific post/event/repo). Preferred.
 * - `profileUrlPattern`: per-user profile URL on the app. Fallback.
 *
 * Apps without either pattern are not clickable.
 */
export interface AppUrlPatterns {
  urlPattern?: string;
  profileUrlPattern?: string;
}

export const APP_URL_PATTERNS: Readonly<Record<string, AppUrlPatterns>> = Object.freeze({
  bluesky: {
    urlPattern: 'https://bsky.app/profile/{handle}/post/{rkey}',
    profileUrlPattern: 'https://bsky.app/profile/{handle}',
  },
  tangled: {
    profileUrlPattern: 'https://tangled.sh/{handle}',
  },
  smokesignal: {
    urlPattern: 'https://smokesignal.events/{did}/{rkey}',
    profileUrlPattern: 'https://smokesignal.events/{did}',
  },
  whitewind: {
    urlPattern: 'https://whtwnd.com/{handle}/{rkey}',
    profileUrlPattern: 'https://whtwnd.com/{handle}',
  },
  frontpage: {
    urlPattern: 'https://frontpage.fyi/post/{did}/{rkey}',
    profileUrlPattern: 'https://frontpage.fyi/profile/{did}',
  },
  linkat: {
    profileUrlPattern: 'https://linkat.blue/{handle}',
  },
  pastesphere: {
    urlPattern: 'https://pastesphere.link/user/{handle}/snippet/{rkey}',
    profileUrlPattern: 'https://pastesphere.link/user/{handle}',
  },
  kipclip: {
    profileUrlPattern: 'https://kipclip.com/{handle}',
  },
  keytrace: {
    profileUrlPattern: 'https://keytrace.dev/@{handle}',
  },
  sifa: {
    profileUrlPattern: 'https://sifa.id/p/{handle}',
  },
  popfeed: {
    urlPattern: 'https://popfeed.social/profile/{handle}',
    profileUrlPattern: 'https://popfeed.social/profile/{handle}',
  },
  streamplace: {
    profileUrlPattern: 'https://stream.place/{handle}',
  },
  semble: {
    profileUrlPattern: 'https://semble.so/profile/{handle}',
  },
  grain: {
    urlPattern: 'https://grain.social/profile/{did}/gallery/{rkey}',
    profileUrlPattern: 'https://grain.social/profile/{did}',
  },
  youandme: { profileUrlPattern: 'https://youandme.at' },
  // anisota: upgraded with per-record URL pattern below.
  margin: { profileUrlPattern: 'https://margin.at' },
  beaconbits: { profileUrlPattern: 'https://beaconbits.app' },
  bookhive: { profileUrlPattern: 'https://bookhive.buzz/profile/{handle}' },
  colibri: { profileUrlPattern: 'https://colibri.social' },
  collectivesocial: { profileUrlPattern: 'https://app.collectivesocial.app' },
  github: {},
  asq: {
    // Questions live at /q/{did}/{rkey}. Answer cards build their own URL
    // from the parsed subject.uri (which points to the question), so the
    // pattern below is invoked only for question records.
    urlPattern: 'https://asq.fyi/q/{did}/{rkey}',
    profileUrlPattern: 'https://asq.fyi',
  },
  passports: {
    // Per-record URLs don't exist on passports.social — its SvelteKit routes
    // stop at /profile/{handle}/{passport_slug}. Profile-level fallback only.
    profileUrlPattern: 'https://passports.social/profile/{handle}',
  },
  leaflet: {
    // Per-document URLs are short and rkey-only: https://leaflet.pub/{rkey}.
    // Each publication has its own base_path subdomain (e.g. zzstoatzz.leaflet.pub)
    // but the canonical short URL renders the same document. There is no
    // per-user profile route on leaflet.pub, so the profile fallback points
    // at the marketing site.
    urlPattern: 'https://leaflet.pub/{rkey}',
    profileUrlPattern: 'https://leaflet.pub',
  },
  spark: {
    // Verified live: GET /post/{did}/{rkey} returns 200.
    urlPattern: 'https://sprk.so/post/{did}/{rkey}',
    profileUrlPattern: 'https://sprk.so/profile/{handle}',
  },
  anisota: {
    urlPattern: 'https://anisota.net/post/{did}/{rkey}',
    profileUrlPattern: 'https://anisota.net/profile/{handle}',
  },
  nooki: {
    // Per-post URLs use slug-based routing (e.g. /post/{slug}), not rkey —
    // can't be constructed from a record. Profile fallback only.
    profileUrlPattern: 'https://nooki.me/user/{handle}',
  },
  atstore: {
    // atstore.fyi has no user-profile pages (the legacy `/@{handle}` pattern
    // resolved to a 404), and no per-review deep link exists. The per-product
    // page (https://atstore.fyi/products/{slug}) is the most specific URL
    // available — resolveCardUrl builds it from record.listingMeta.slug,
    // which sifa-api enriches by resolving the review's `subject` to the
    // referenced listing.detail record.
    profileUrlPattern: 'https://atstore.fyi',
  },
  plyr: {
    // SPA — per-record URLs require JS routing. plyr.fm doesn't expose a
    // public per-handle profile page server-side either; falls back to root.
    profileUrlPattern: 'https://plyr.fm',
  },
});

/**
 * Map collection NSID prefixes to app ids. Order matters: longer / more
 * specific prefixes must come before broader ones.
 */
export const COLLECTION_TO_APP: ReadonlyArray<readonly [prefix: string, appId: string]> = [
  ['app.bsky.', 'bluesky'],
  ['sh.tangled.', 'tangled'],
  ['events.smokesignal.', 'smokesignal'],
  ['community.lexicon.calendar.', 'smokesignal'],
  ['community.lexicon.bookmarks.', 'kipclip'],
  ['com.kipclip.', 'kipclip'],
  ['blue.flashes.', 'flashes'],
  ['social.grain.', 'grain'],
  ['com.whtwnd.', 'whitewind'],
  ['fyi.unravel.frontpage.', 'frontpage'],
  ['social.psky.', 'picosky'],
  ['blue.linkat.', 'linkat'],
  ['link.pastesphere.', 'pastesphere'],
  ['site.standard.', 'standard'],
  ['computer.aetheros.', 'aetheros'],
  ['space.roomy.', 'roomy'],
  ['dev.keytrace.', 'keytrace'],
  ['social.popfeed.', 'popfeed'],
  ['app.popsky.', 'popfeed'],
  ['place.stream.', 'streamplace'],
  ['app.sidetrail.', 'semble'],
  ['network.cosmik.', 'cosmik'],
  ['id.sifa.', 'sifa'],
  ['forum.barazo.', 'barazo'],
  ['xyz.statusphere.', 'statusphere'],
  ['at.youandme.', 'youandme'],
  ['net.anisota.', 'anisota'],
  ['at.margin.', 'margin'],
  ['app.beaconbits.', 'beaconbits'],
  ['buzz.bookhive.', 'bookhive'],
  ['social.colibri.', 'colibri'],
  ['social.passports.', 'passports'],
  ['fyi.asq.', 'asq'],
  ['pub.leaflet.', 'leaflet'],
  ['so.sprk.', 'spark'],
  ['community.nooki.', 'nooki'],
  ['fyi.atstore.', 'atstore'],
  ['fm.plyr.', 'plyr'],
];
