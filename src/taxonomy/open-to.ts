/**
 * "Open to" taxonomy. Mirrors `id.sifa.defs#openToWorkStatus.knownValues` from
 * sifa-lexicons. Surfaces a single source of truth for the editor (where the
 * user picks values) and the IdentityCard (where badges are rendered).
 *
 * Shape matches `INDUSTRY_OPTIONS`: `{ value, labelKey }` so consumers can run
 * `labelKey` through their own i18n layer (e.g. next-intl `useTranslations`).
 */

export interface OpenToOption {
  value: string;
  labelKey: string;
}

export const OPEN_TO_OPTIONS: OpenToOption[] = [
  { value: 'id.sifa.defs#fullTimeRoles', labelKey: 'fullTimeRoles' },
  { value: 'id.sifa.defs#partTimeRoles', labelKey: 'partTimeRoles' },
  { value: 'id.sifa.defs#contractRoles', labelKey: 'contractRoles' },
  { value: 'id.sifa.defs#commissions', labelKey: 'commissions' },
  { value: 'id.sifa.defs#boardPositions', labelKey: 'boardPositions' },
  { value: 'id.sifa.defs#mentoringOthers', labelKey: 'mentoringOthers' },
  { value: 'id.sifa.defs#beingMentored', labelKey: 'beingMentored' },
  { value: 'id.sifa.defs#collaborations', labelKey: 'collaborations' },
];

/**
 * Legacy aliases — tokens the lexicon used to expose but doesn't anymore.
 * Records written before the lexicon migration may still carry them; resolve
 * them to the closest current `labelKey` for display.
 */
const OPEN_TO_LEGACY_ALIASES: Record<string, string> = {
  'id.sifa.defs#mentoring': 'mentoringOthers',
};

const OPEN_TO_LABEL_KEY_MAP: Record<string, string> = {
  ...Object.fromEntries(OPEN_TO_OPTIONS.map((o) => [o.value, o.labelKey])),
  ...OPEN_TO_LEGACY_ALIASES,
};

/**
 * Resolve a `labelKey` for an `openToWorkStatus` token. Returns `undefined`
 * for tokens not in the canonical set or the legacy alias map, so callers
 * can choose their own fallback (e.g. render the raw value).
 */
export function getOpenToLabelKey(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return OPEN_TO_LABEL_KEY_MAP[value];
}
