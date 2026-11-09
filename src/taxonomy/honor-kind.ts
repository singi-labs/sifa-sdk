/**
 * Honor-kind taxonomy. Mirrors the `id.sifa.defs#honor*` knownValues of
 * `id.sifa.profile.honor#kind` from sifa-lexicons. The set is open: a record
 * may carry a token this list does not know.
 */

export interface HonorKindOption {
  value: string;
  label: string;
}

export const HONOR_KIND_OPTIONS: HonorKindOption[] = [
  { value: 'id.sifa.defs#honorAward', label: 'Award' },
  { value: 'id.sifa.defs#honorNomination', label: 'Nomination' },
  { value: 'id.sifa.defs#honorChampionship', label: 'Championship' },
  { value: 'id.sifa.defs#honorRecord', label: 'Record' },
  { value: 'id.sifa.defs#honorRecognition', label: 'Recognition' },
];

export const HONOR_KIND_LABELS: Record<string, string> = Object.fromEntries(
  HONOR_KIND_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Resolve the label for an honor-kind token. Absent and unknown tokens return
 * undefined, so consumers show no label rather than a raw token or a guess.
 */
export function getHonorKindLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return HONOR_KIND_LABELS[value];
}
