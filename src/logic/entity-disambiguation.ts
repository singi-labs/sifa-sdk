import type { EntitySearchResult } from '../schemas/entity.js';

/**
 * Disambiguation-display helpers for the org typeahead (#159, Flow 1A-2). Two
 * same-name orgs must be told apart at a glance, so each row shows its domain,
 * country, and parent where known.
 */

export interface DisambiguationFields {
  domain?: string | null;
  country?: string | null;
  parentName?: string | null;
}

/**
 * Build the muted secondary line for a typeahead row, e.g.
 * `spryker.com · DE · part of Spryker Holding`. Empty when nothing to show.
 */
export function entityDisambiguationLabel(fields: DisambiguationFields): string {
  const parts: string[] = [];
  if (fields.domain) parts.push(fields.domain);
  if (fields.country) parts.push(fields.country);
  if (fields.parentName) parts.push(`part of ${fields.parentName}`);
  return parts.join(' · ');
}

/** Convenience over {@link entityDisambiguationLabel} for a search result row. */
export function searchResultDisambiguation(result: EntitySearchResult): string {
  return entityDisambiguationLabel({
    domain: result.domain,
    country: result.country,
    parentName: result.parentName,
  });
}

/** Stable per-row identity for React keys and dedupe (entity id or PDL id). */
export function entityResultKey(result: EntitySearchResult): string {
  return result.source === 'entity' ? `entity:${result.entityId}` : `pdl:${result.pdlId}`;
}
