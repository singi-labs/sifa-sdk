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
  anisota: { profileUrlPattern: 'https://anisota.net' },
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
];
