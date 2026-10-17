import { APP_URL_PATTERNS } from './app-url-patterns.js';

/**
 * Whether an app can link to a single item at all. False only for apps marked
 * `itemLinks: false` in {@link APP_URL_PATTERNS} (Passports, Collective Social,
 * Pixl): their items can only link a profile, a homepage, or nothing, so none
 * reaches the timeline and a source pill for them would open an empty feed.
 * Every other app counts as able to link, since items can also link through a
 * resolver branch or a URL on the record itself.
 */
export function appLinksItems(appId: string): boolean {
  return APP_URL_PATTERNS[appId]?.itemLinks !== false;
}
