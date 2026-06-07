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
  smokesignal: 'Events',
  flashes: 'Photos',
  grain: 'Photos',
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

  // Web-only (rendered in pills/cards via sifa-web atproto-apps.ts;
  // no backend scan collection yet)
  linkat: 'Links',
  kipclip: 'Links',
  statusphere: 'Social',
  margin: 'Research',
} as const satisfies Record<string, AppCategoryId>;

export type KnownAppId = keyof typeof APP_CATEGORY_MAP;

export function isKnownAppId(appId: string): appId is KnownAppId {
  return Object.prototype.hasOwnProperty.call(APP_CATEGORY_MAP, appId);
}

export function categoryForApp(appId: string): AppCategoryId | undefined {
  return isKnownAppId(appId) ? APP_CATEGORY_MAP[appId] : undefined;
}
