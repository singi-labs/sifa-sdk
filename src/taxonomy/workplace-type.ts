/**
 * Workplace-type taxonomy. Mirrors `id.sifa.defs#workplaceType.knownValues`
 * from sifa-lexicons. `remote` is retained for legacy records but the scoped
 * variants (`remoteLocal`, `remoteRegion`, `remoteGlobal`) are preferred for
 * new records per the lexicon description.
 */

export interface WorkplaceTypeOption {
  value: string;
  label: string;
}

export const WORKPLACE_TYPE_OPTIONS: WorkplaceTypeOption[] = [
  { value: 'id.sifa.defs#onSite', label: 'On-site' },
  { value: 'id.sifa.defs#hybrid', label: 'Hybrid' },
  { value: 'id.sifa.defs#remoteLocal', label: 'Remote (same country)' },
  { value: 'id.sifa.defs#remoteRegion', label: 'Remote (same region)' },
  { value: 'id.sifa.defs#remoteGlobal', label: 'Remote (anywhere)' },
];

export const WORKPLACE_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(WORKPLACE_TYPE_OPTIONS.map((o) => [o.value, o.label])),
  'id.sifa.defs#remote': 'Remote',
};

/** Resolve a label for a workplace-type token. Falls back to the raw value. */
export function getWorkplaceTypeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return WORKPLACE_TYPE_LABELS[value] ?? value;
}

/**
 * Legacy workplace tokens the lexicon retains for old records, mapped to their
 * current canonical token. `id.sifa.defs#remote` is "Treated as remoteGlobal by
 * AppViews" per the lexicon, so it resolves to the scoped `remoteGlobal`.
 */
export const WORKPLACE_TYPE_LEGACY_ALIASES: Record<string, string> = {
  'id.sifa.defs#remote': 'id.sifa.defs#remoteGlobal',
};

/**
 * Normalize a list of workplace-type tokens: resolve legacy aliases to their
 * canonical token, then dedup while preserving first-seen order. Unknown tokens
 * pass through untouched (forward-compat). Used by the editor (so a legacy token
 * maps onto a real option and migrates forward on save) and by display (so a
 * record carrying both the legacy and canonical token renders a single badge).
 */
export function normalizeWorkplaceTypes(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const canonical = WORKPLACE_TYPE_LEGACY_ALIASES[value] ?? value;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}
