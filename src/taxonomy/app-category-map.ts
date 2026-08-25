/**
 * Maps every AT Protocol app Sifa tracks to its `AppCategoryId`. Single source
 * of truth for what category an app belongs to; sifa-api and sifa-web both
 * import from here.
 *
 * Add a new app: pick the category whose generic glyph best represents the
 * activity. If no existing category fits, add a new one to APP_CATEGORIES
 * rather than introducing a per-app override.
 */

import type { AppCategoryId } from './app-categories.js';

export const APP_CATEGORY_MAP = {
  // Backend-scanned (sifa-api APP_REGISTRY)
  bluesky: 'Posts',
  tangled: 'Code',
  github: 'Code',
  // Posts ingested from a verified Fediverse (ActivityPub) account. Like
  // github, there is no PDS collection behind it -- its own scanner owns the
  // app-stats row.
  fediverse: 'Posts',
  // Items ingested from a verified RSS or Atom feed: blogs, newsletters,
  // podcast and channel feeds. Categorized as Articles rather than Posts
  // because the common case is a long-form blog entry with a title.
  rss: 'Articles',
  smokesignal: 'Events',
  flashes: 'Photos',
  grain: 'Photos',
  pixl: 'Photos', // pics.pixl.image — photo posts on pixl.pics
  whitewind: 'Articles',
  frontpage: 'Links',
  pastesphere: 'Pastes',
  standard: 'Articles',
  aetheros: 'Pages',
  roomy: 'Social',
  keytrace: 'Verification',
  popfeed: 'Reviews',
  streamplace: 'Video',
  semble: 'Research',
  youandme: 'Social',
  leaflet: 'Articles',
  colibri: 'Social',
  collectivesocial: 'Lists',
  bookhive: 'Reviews',
  beaconbits: 'Places',
  passports: 'Places',
  asq: 'Q&A',
  spark: 'Posts',
  nooki: 'Social',
  atstore: 'Reviews',
  plyr: 'Music',
  anisota: 'Posts',
  atfund: 'Endorsements',
  crate: 'Articles',
  atmorsvp: 'Events',
  opensocial: 'Social',
  // Kevara speaker-directory listing — a professional speaking-availability
  // declaration (talk topics, formats like keynote/panel/conference-talk).
  // Grouped under Events as the closest fit (speaking engagements).
  kevara: 'Events',
  // Marque domain registrar — a domain registration record is a dated
  // identity/ownership action, surfaced as a "registered a domain" event.
  marque: 'Domains',
  // ATCR (io.atcr) — distributed OCI container registry. The portfolio entry
  // is io.atcr.repo.page (a published repository with a markdown README);
  // manifests and tags are low-level artifacts excluded backend-side.
  atcr: 'Code',
  // Batch onboard — apps surfaced on high-volume profiles. Each gives its
  // collections a named pill + category icon instead of a raw NSID.
  mcp: 'Code', // app.mcp.server — published MCP servers (name/tools/language)
  userinput: 'Social', // app.userinput — roadmap discussions + replies
  minomobi: 'Music', // com.minomobi.music.composition — authored music
  voxport: 'Video', // com.voxport.podcast.series — podcast series
  badges: 'Verification', // community.lexicon.badge.award — signed earned credentials
  atvouch: 'Endorsements', // dev.atvouch.graph.vouch — trust vouches
  watsm: 'Code', // io.calabro.watsm.program — published WASM programs
  plonk: 'Pastes', // li.plonk.paste — text pastes
  alternativeproto: 'Links', // net.alternativeproto.submission — app-directory listings
  papili: 'Links', // one.papili.post — link posts
  vit: 'Code', // org.v-it.skill — published agent skills
  lifepo: 'Social', // st.lifepo.lifeEvent — life-event timeline
  streamthought: 'Posts', // stream.thought.blip — microblog thoughts
  waow: 'Photos', // tech.waow.* — doodl drawings (dominant), polls, slides
  lichen: 'Pages', // wiki.lichen — wiki notes + wikis
  // Onboard from aramzs.xyz profile audit — new named pills.
  aetherdocs: 'Slides', // os.aether.docs.presentation — authored slide decks
  kich: 'Recipes', // io.kich.recipe.recipe — authored recipes
  margin: 'Research', // at.margin.{note,annotation} — web-annotation notes with a body
  // Onboard from moll.dev profile audit.
  recipe: 'Recipes', // exchange.recipe.recipe — authored recipes on recipe.exchange

  // Onboard from willow.sh profile audit.
  guestbook: 'Social', // dev.baileytownsend.guestbook.entry — a note left on someone's cross-site guestbook

  // Onboard from trezy.codes profile audit.
  atmobb: 'Social', // app.atmobb.discussion.{thread,reply} — federated forum threads + replies

  // Onboard from aaronstevenwhite.io profile audit.
  chive: 'Research', // pub.chive.eprint.submission — preprints on chive.pub

  // Onboard from helene-cook.eu profile audit.
  zeens: 'Photos', // app.photosky.collection — curated photo collections on zeens.app

  // Onboard from scanash.com profile audit.
  locale: 'Translations', // at.locale.{project,translation} — localization projects and authored translation strings on locale.at
  pckt: 'Posts', // blog.pckt.mini.post — microblog posts with no site.standard.document twin

  // Onboard from the holke.xyz profile audit (impact-funding ecosystem).
  hypercerts: 'Impact', // org.hypercerts.{claim.activity,collection} — authored claims of work done, and the project collections that group them
  certified: 'Endorsements', // app.certified.{badge.award,actor.membership} — endorsements issued to another DID, and group memberships
  impactindexer: 'Reviews', // org.impactindexer.review.comment — written reviews of a hypercert claim
  pinksea: 'Art', // com.shinolabs.pinksea.oekaki — hand-drawn artwork posted to the PinkSea oekaki BBS

  // Web-only (rendered in pills/cards via sifa-web atproto-apps.ts;
  // no backend scan collection yet)
  linkat: 'Links',
  kipclip: 'Links',
  statusphere: 'Social',
} as const satisfies Record<string, AppCategoryId>;

export type KnownAppId = keyof typeof APP_CATEGORY_MAP;

export function isKnownAppId(appId: string): appId is KnownAppId {
  return Object.prototype.hasOwnProperty.call(APP_CATEGORY_MAP, appId);
}

export function categoryForApp(appId: string): AppCategoryId | undefined {
  return isKnownAppId(appId) ? APP_CATEGORY_MAP[appId] : undefined;
}
