import { APP_URL_PATTERNS } from './app-url-patterns.js';
import { getAppIdForCollection } from './resolve-card-url.js';

/**
 * Collections whose per-item link is built by app-specific code in
 * {@link resolveCardHealth} rather than a `urlPattern`. Listed by collection so
 * the app ids come from the same prefix map the resolver uses.
 */
const ITEM_RESOLVER_COLLECTIONS = [
  'sh.tangled.repo',
  'app.userinput.discussion',
  'com.kipclip.bookmark',
  'community.lexicon.bookmarks.bookmark',
  'at.margin.bookmark',
  'community.lexicon.calendar.rsvp',
  'quest.atmo.event',
  'app.atmobb.discussion.thread',
  'social.kut.community.membership',
  'fyi.atstore.listing.review',
  'social.crate.content',
  'site.standard.document',
  'io.kich.recipe.recipe',
  'exchange.recipe.recipe',
  'in.atmob.paste.document',
  'at.marque.domain',
];

const ITEM_RESOLVER_APPS = new Set(ITEM_RESOLVER_COLLECTIONS.map(getAppIdForCollection));

/**
 * Whether an app can link to a single item at all: it has a per-item URL
 * pattern or app-specific item resolution. False for apps that can only link
 * the author's profile, the app's homepage, or nothing (Passports, Collective
 * Social, Pixl). Their items never reach the timeline, so a source pill for
 * them would open an empty feed.
 *
 * Records that carry their own `url` can still link on an app where this is
 * false; this is a per-app answer, not a per-record one.
 */
export function appLinksItems(appId: string): boolean {
  if (APP_URL_PATTERNS[appId]?.urlPattern) return true;
  return ITEM_RESOLVER_APPS.has(appId);
}
