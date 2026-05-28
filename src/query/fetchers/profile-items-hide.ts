import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/** Item types that can be hidden on the authenticated user's profile. */
export const HIDDEN_ITEM_TYPES = [
  'position',
  'education',
  'certification',
  'project',
  'volunteering',
  'publication',
  'course',
  'honor',
  'language',
  'externalAccount',
] as const;
export type HiddenItemType = (typeof HIDDEN_ITEM_TYPES)[number];

/** Source from which an item originates; disambiguates `item_id`. */
export const HIDDEN_ITEM_SOURCES = ['pds', 'standard', 'orcid'] as const;
export type HiddenItemSource = (typeof HIDDEN_ITEM_SOURCES)[number];

export interface HideProfileItemInput {
  itemType: HiddenItemType;
  source: HiddenItemSource;
  /** rkey for `pds`, AT-URI for `standard`, ORCID putCode as text for `orcid`. */
  itemId: string;
}

export interface BulkHideProfileItemInput {
  itemType: HiddenItemType;
  source: HiddenItemSource;
  itemIds: string[];
}

/**
 * Hide one profile item. The underlying record stays on the user's PDS;
 * only its display on sifa.id is suppressed.
 */
export function hideProfileItem(
  config: SifaApiConfig,
  input: HideProfileItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/items/hide', 'POST', { ...options, body: input });
}

/** Restore a previously-hidden profile item. */
export function unhideProfileItem(
  config: SifaApiConfig,
  input: HideProfileItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/items/hide', 'DELETE', { ...options, body: input });
}

/** Bulk-hide profile items sharing the same `itemType` + `source`. */
export function bulkHideProfileItems(
  config: SifaApiConfig,
  input: BulkHideProfileItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/items/bulk-hide', 'POST', { ...options, body: input });
}

/** Bulk-unhide profile items sharing the same `itemType` + `source`. */
export function bulkUnhideProfileItems(
  config: SifaApiConfig,
  input: BulkHideProfileItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/items/bulk-hide', 'DELETE', { ...options, body: input });
}
