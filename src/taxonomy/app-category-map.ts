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
  // API registry (backend-scanned)
  bluesky: 'Posts',
  tangled: 'Code',
  github: 'Code',
  smokesignal: 'Events',
  flashes: 'Photos',
  grain: 'Photos',
  whitewind: 'Articles',
  frontpage: 'Links',
  picosky: 'Chat',
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

  // Web-only (rendered in pills/cards; not scanned as standalone collections yet)
  linkat: 'Links',
  kipclip: 'Links',
  statusphere: 'Social',
  bookhive: 'Reviews',
  passports: 'Social',
  beaconbits: 'Places',
  margin: 'Research',
  anisota: 'Posts',
  asq: 'Questions',
} as const satisfies Record<string, AppCategoryId>;

export type KnownAppId = keyof typeof APP_CATEGORY_MAP;

export function isKnownAppId(appId: string): appId is KnownAppId {
  return Object.prototype.hasOwnProperty.call(APP_CATEGORY_MAP, appId);
}

export function categoryForApp(appId: string): AppCategoryId | undefined {
  return isKnownAppId(appId) ? APP_CATEGORY_MAP[appId] : undefined;
}
