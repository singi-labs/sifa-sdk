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
