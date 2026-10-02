import { z } from 'zod';

import { isAppCategory } from '../taxonomy/app-categories.js';

export const SITE_PRESET_MAX_TAGS = 20;
export const SITE_PRESET_MAX_TAG_LENGTH = 64;

/** A preset as the API returns it. */
export const siteActivityPresetSchema = z.object({
  categories: z.array(z.string().min(1).max(100)).max(100),
  tags: z.array(z.string().min(1).max(SITE_PRESET_MAX_TAG_LENGTH)).max(SITE_PRESET_MAX_TAGS),
});

/**
 * Per-site activity filter ("show only") for a personal site (page.sifa.id and
 * third-party site builders that read Sifa data).
 *
 * Two independent allow-lists:
 *
 * - `categories`: app categories (see `APP_CATEGORY_IDS`) the site shows. Empty
 *   means every category.
 * - `tags`: tags a long-form post must carry to show. Empty means every
 *   long-form post. Applies to the `Articles` category only; other activity is
 *   never filtered on tags.
 *
 * Tags are read from `record.tags` (a string array). Of the long-form sources
 * Sifa tracks, Standard.site documents (`site.standard.document`, which
 * Leaflet, pckt and other blogs write) and Crate content and notes carry tags.
 * WhiteWind, GreenGale and RSS/Atom feed items have no tags, so with a tag
 * filter set they never match.
 *
 * Both lists empty is "no preset": the site shows the same activity it does
 * without one.
 */
export type SiteActivityPreset = z.infer<typeof siteActivityPresetSchema>;

export const EMPTY_SITE_ACTIVITY_PRESET: SiteActivityPreset = { categories: [], tags: [] };

/** The only category the tag filter applies to. */
export const SITE_PRESET_TAG_CATEGORY = 'Articles';

/**
 * Canonical form of a tag: trimmed, without a leading `#`, lowercased, inner
 * whitespace collapsed. Returns `null` for an empty or over-long tag.
 */
export function normalizeSitePresetTag(raw: string): string | null {
  const tag = raw.trim().replace(/^#+/, '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (tag.length === 0 || tag.length > SITE_PRESET_MAX_TAG_LENGTH) return null;
  return tag;
}

/**
 * Parse free-text tag input (comma- or newline-separated, or an array of such
 * strings) into a normalized, de-duplicated, capped list.
 */
export function parseSitePresetTags(input: string | readonly string[]): string[] {
  const parts = (typeof input === 'string' ? [input] : input).flatMap((s) => s.split(/[,\n]/));
  const out: string[] = [];
  for (const part of parts) {
    const tag = normalizeSitePresetTag(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= SITE_PRESET_MAX_TAGS) break;
  }
  return out;
}

export function isSiteActivityPresetActive(preset: SiteActivityPreset): boolean {
  return preset.categories.length > 0 || preset.tags.length > 0;
}

/** Normalized string tags off a record's `tags` field, or `[]`. */
export function recordTags(record: unknown): string[] {
  if (typeof record !== 'object' || record === null) return [];
  const tags = 'tags' in record ? record.tags : undefined;
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    const tag = normalizeSitePresetTag(t);
    if (tag) out.push(tag);
  }
  return out;
}

interface PresetItem {
  category: string;
  record: unknown;
}

/**
 * Tag half of the preset. Items outside long-form posts always pass; a
 * long-form post passes when no tags are set or it carries one of them.
 */
export function matchesSitePresetTags(item: PresetItem, tags: readonly string[]): boolean {
  if (tags.length === 0 || item.category !== SITE_PRESET_TAG_CATEGORY) return true;
  return recordTags(item.record).some((t) => tags.includes(t));
}

/** Whether an activity item shows on a site with this preset. */
export function matchesSiteActivityPreset(item: PresetItem, preset: SiteActivityPreset): boolean {
  if (preset.categories.length > 0 && !preset.categories.includes(item.category)) return false;
  return matchesSitePresetTags(item, preset.tags);
}

/**
 * A preset as a client sends it. Categories must be known app categories;
 * tags are normalized and de-duplicated. Replaces the whole stored preset.
 */
export const siteActivityPresetUpdateSchema = z.object({
  categories: z
    .array(z.string().refine(isAppCategory, { message: 'Unknown category' }))
    .max(100)
    .transform((list) => [...new Set(list)]),
  tags: z
    .array(z.string().max(200))
    .max(100)
    .transform((list) => parseSitePresetTags(list)),
});
