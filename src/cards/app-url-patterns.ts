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
  // Community-calendar events (community.lexicon.calendar.*, incl. records
  // originally authored in the decommissioned Smoke Signal). atmo.rsvp resolves
  // any such event by did+rkey, so links point there. Internal id kept as
  // `smokesignal` for continuity with existing token/color keys.
  smokesignal: {
    urlPattern: 'https://atmo.rsvp/p/{did}/e/{rkey}',
    profileUrlPattern: 'https://atmo.rsvp/p/{did}',
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
  // atmoBB per-item thread/reply URLs are built bespoke in resolve-card-url.ts
  // (raw-colon /t/{did}/{rkey}); this is only the member-profile fallback.
  atmobb: { profileUrlPattern: 'https://atmobb.app/members/{did}' },
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
  atfund: {
    // at.fund is auth-gated — `/give/{did}` 307s to `/` when not signed in,
    // and there's no public per-endorsement permalink. Profile fallback only,
    // pointing at the main /give listing.
    profileUrlPattern: 'https://www.at.fund/give',
  },
  crate: {
    // Crate (app.crate.social) is an authoring dashboard with no public
    // per-record viewer or per-handle profile page — records are designed to
    // render on the maker's own site. `content` cards link out via
    // record.canonicalUrl (handled in resolveCardUrl); `note` records have no
    // public URL and render non-clickable. So no app-level pattern applies.
  },
  guestbook: {
    // Guestbook (dev.baileytownsend.guestbook) is a self-hosted, cross-site
    // widget: each site owner renders their own guestbook wherever they choose,
    // so there is no canonical public per-entry viewer or per-handle profile
    // page. Entries render non-clickable. Same shape as crate `note`.
  },
  atmorsvp: {
    // atmo.rsvp events live at /p/{did}/e/{rkey}. The per-item pattern is used
    // for the event record itself; checkin records build their URL from the
    // referenced event uri in resolveCardUrl (mirrors smokesignal rsvp).
    urlPattern: 'https://atmo.rsvp/p/{did}/e/{rkey}',
    profileUrlPattern: 'https://atmo.rsvp/p/{did}',
  },
  opensocial: {
    // Open Social (opensocial.community) is community-management infrastructure
    // with no public per-membership permalink. Profile fallback only.
    profileUrlPattern: 'https://opensocial.community',
  },
  kevara: {
    // Kevara (professional network) has no live public web surface yet — its
    // domain doesn't resolve and there's no per-record viewer. Recognized so
    // the speaker-directory card renders with the right pill, but non-clickable.
  },
  atcr: {
    // ATCR repositories live at /r/{handle}/{repository}, where the rkey of an
    // io.atcr.repo.page record is the repository name. Verified live: GET
    // /r/{handle}/{rkey} and /u/{handle} both return 200.
    urlPattern: 'https://atcr.io/r/{handle}/{rkey}',
    profileUrlPattern: 'https://atcr.io/u/{handle}',
  },
  kich: {
    // Kich recipe viewer. Verified: GET /recipes/{rkey} returns 200 (the SPA
    // renders the recipe by rkey); /recipe/{rkey} 404s. No public per-handle
    // profile page, so the profile fallback points at the app root.
    urlPattern: 'https://kich.io/recipes/{rkey}',
    profileUrlPattern: 'https://kich.io',
  },
  recipe: {
    // recipe.exchange viewer. Verified: GET /recipes/{rkey} returns 200 (rkey
    // alone; no did needed) and /profiles/{handle} returns 200 for the author
    // page. /recipe/{rkey} 404s.
    urlPattern: 'https://recipe.exchange/recipes/{rkey}',
    profileUrlPattern: 'https://recipe.exchange/profiles/{handle}',
  },
  aetherdocs: {
    // Aether OS is a browser OS — presentations open inside it and there's no
    // public per-record viewer. The card embeds the deck from the record; the
    // outbound link points at the author's Aether OS space (mirrors aetheros).
    profileUrlPattern: 'https://aetheros.computer/{handle}',
  },
  zeens: {
    // Zeens (zeens.app) still uses its former app.photosky.* namespace. The
    // app redirects /collection/{handle}/{rkey} to the canonical path below.
    urlPattern: 'https://zeens.app/profile/{handle}/collections/{rkey}',
    profileUrlPattern: 'https://zeens.app/profile/{handle}',
  },
  chive: {
    // Chive's eprint route is a catch-all that decodes a single URI-encoded
    // at-uri segment: /eprints/<encodeURIComponent(at://did/nsid/rkey)>.
    // {did} and {rkey} are URI-encoded on interpolation, so the separators
    // are pre-encoded as literals here rather than resolved bespoke.
    urlPattern: 'https://chive.pub/eprints/at%3A%2F%2F{did}%2Fpub.chive.eprint.submission%2F{rkey}',
    profileUrlPattern: 'https://chive.pub/authors/{did}',
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
  ['fund.at.', 'atfund'],
  ['social.crate.', 'crate'],
  ['quest.atmo.', 'atmorsvp'],
  ['community.opensocial.', 'opensocial'],
  ['is.kevara.', 'kevara'],
  ['io.atcr.', 'atcr'],
  // Batch onboard — named pills for apps that were leaking as raw NSIDs.
  ['app.mcp.', 'mcp'],
  ['app.userinput.', 'userinput'],
  ['com.minomobi.', 'minomobi'],
  ['com.voxport.', 'voxport'],
  ['community.lexicon.badge.', 'badges'],
  ['dev.atvouch.', 'atvouch'],
  ['io.calabro.watsm.', 'watsm'],
  ['li.plonk.', 'plonk'],
  ['net.alternativeproto.', 'alternativeproto'],
  ['one.papili.', 'papili'],
  ['org.v-it.', 'vit'],
  ['st.lifepo.', 'lifepo'],
  ['stream.thought.', 'streamthought'],
  ['tech.waow.', 'waow'],
  ['wiki.lichen.', 'lichen'],
  // Onboard from aramzs.xyz profile audit.
  ['os.aether.', 'aetherdocs'],
  ['io.kich.recipe.recipe', 'kich'],
  // Onboard from moll.dev profile audit.
  ['exchange.recipe.recipe', 'recipe'],
  // Onboard from willow.sh profile audit.
  ['dev.baileytownsend.guestbook.', 'guestbook'],
  // Onboard from trezy.codes profile audit.
  ['app.atmobb.', 'atmobb'],
  // Onboard from aaronstevenwhite.io profile audit.
  ['pub.chive.', 'chive'],
  // Onboard from helene-cook.eu profile audit. Zeens kept its old NSID.
  ['app.photosky.', 'zeens'],
];
