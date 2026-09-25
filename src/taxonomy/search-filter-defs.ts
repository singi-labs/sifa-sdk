import type { SearchFilters } from '../query/fetchers/search.js';

/**
 * Shared presentation metadata for the profile-search filters, so every Sifa
 * client (web and app) renders the same filters, in the same order, with the
 * same labels. The filter SET and its query mapping live in `SearchFilters` /
 * `fetchSearchProfiles`; the OPTION values come from `fetchSearchFilters` (server
 * facets) and the static taxonomies; this ties the two together with the
 * label/order/control the UI needs. Labels are literal English (canonical) so a
 * client without an i18n layer never has to keep its own copy.
 */

/** How a filter is rendered. */
export type SearchFilterControl = 'skill-typeahead' | 'select' | 'multi-select';

/** Where a control sources its option values. */
export type SearchFilterOptionSource =
  /** Static SDK taxonomy (INDUSTRY_OPTIONS, WORKPLACE_TYPE_OPTIONS, OPEN_TO_OPTIONS, or an industry's domains). */
  | { kind: 'taxonomy'; ref: 'industry' | 'domain' | 'workplace' | 'openTo' }
  /** Server facet from `fetchSearchFilters` (FilterOptions). */
  | { kind: 'facet'; ref: 'countries' | 'industries' | 'apps' | 'openTo' }
  /** Debounced typeahead (`fetchSkillSuggestions`); the value is free text. */
  | { kind: 'typeahead' };

export interface SearchFilterDef {
  /** Matches the `SearchFilters` key it writes (enforced by the type). */
  key: Exclude<keyof SearchFilters, 'q' | 'limit'>;
  /** Literal English filter label. */
  label: string;
  /** Label for the "no selection" / all option on `select` controls. */
  allLabel?: string;
  control: SearchFilterControl;
  optionSource: SearchFilterOptionSource;
  /** Render order (ascending). Explicit so it can't drift from array order. */
  order: number;
  /** Shown only when this other filter has a value (domain needs an industry). */
  dependsOn?: Exclude<keyof SearchFilters, 'q' | 'limit'>;
  /** Hidden when searching companies rather than people. */
  peopleOnly?: boolean;
  /** Defined in the type but not yet surfaced in any UI (e.g. `app`). */
  hidden?: boolean;
}

/**
 * Canonical filter list, in render order. `q` (free text) is deliberately not
 * here: it is the primary search box, not a sidebar filter. Consumers should
 * skip `hidden` defs and, when searching companies, `peopleOnly` defs.
 */
export const SEARCH_FILTER_DEFS: readonly SearchFilterDef[] = [
  {
    key: 'skill',
    label: 'Skill',
    control: 'skill-typeahead',
    optionSource: { kind: 'typeahead' },
    order: 1,
    peopleOnly: true,
  },
  {
    key: 'country',
    label: 'Country',
    allLabel: 'All countries',
    control: 'select',
    optionSource: { kind: 'facet', ref: 'countries' },
    order: 2,
  },
  {
    key: 'industry',
    label: 'Industry',
    allLabel: 'All industries',
    control: 'select',
    optionSource: { kind: 'taxonomy', ref: 'industry' },
    order: 3,
  },
  {
    key: 'domain',
    label: 'Domain',
    allLabel: 'All domains',
    control: 'select',
    optionSource: { kind: 'taxonomy', ref: 'domain' },
    order: 4,
    dependsOn: 'industry',
  },
  {
    key: 'workplace',
    label: 'Workplace',
    allLabel: 'Any arrangement',
    control: 'select',
    optionSource: { kind: 'taxonomy', ref: 'workplace' },
    order: 5,
    peopleOnly: true,
  },
  {
    key: 'openTo',
    label: 'Open to',
    control: 'multi-select',
    optionSource: { kind: 'taxonomy', ref: 'openTo' },
    order: 6,
    peopleOnly: true,
  },
  {
    key: 'app',
    label: 'App',
    allLabel: 'All apps',
    control: 'select',
    optionSource: { kind: 'facet', ref: 'apps' },
    order: 7,
    hidden: true,
  },
];
