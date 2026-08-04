import type { LocationValue } from '../types/index.js';

export type LocationSegmentKind = 'locality' | 'region' | 'country';

export interface LocationSegment {
  kind: LocationSegmentKind;
  /** Text to render for this segment. */
  label: string;
  /** Search URL for this segment, or null when it should render as plain text. */
  searchHref: string | null;
}

export interface LocationSegmentsOptions {
  /**
   * Whether the country is one the search index can filter on. Profiles
   * imported from LinkedIn sometimes hold a metro area ("Greater Bielefeld
   * Area") in the country field; linking one promises a result set that does
   * not exist, so those render as plain text. Defaults to true.
   */
  searchable?: boolean;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Split a location into the ordered segments shown on a profile, marking which
 * ones link to a search.
 *
 * Only the country links today. Region is the weakest of the three (free text,
 * no search filter) and locality has no filter yet, so both render as plain
 * text until those land.
 *
 * A segment equal to its neighbour is dropped: capital regions produce
 * "Oslo, Oslo, Norway", and repeating the word helps nobody. Blank segments are
 * dropped with their separator so nothing renders as "Oslo, , Norway".
 */
export function locationSegments(
  loc: LocationValue | null | undefined,
  options: LocationSegmentsOptions = {},
): LocationSegment[] {
  if (!loc) return [];

  const ordered: Array<{ kind: LocationSegmentKind; value: string | null }> = [
    { kind: 'locality', value: clean(loc.locality ?? loc.city) },
    { kind: 'region', value: clean(loc.region) },
    { kind: 'country', value: clean(loc.country) },
  ];

  const segments: LocationSegment[] = [];
  for (const { kind, value } of ordered) {
    if (value === null) continue;
    const previous = segments[segments.length - 1];
    if (previous && previous.label.toLowerCase() === value.toLowerCase()) continue;

    segments.push({
      kind,
      label: value,
      searchHref:
        kind === 'country' && options.searchable !== false
          ? `/search?${new URLSearchParams({ country: value }).toString()}`
          : null,
    });
  }

  return segments;
}
