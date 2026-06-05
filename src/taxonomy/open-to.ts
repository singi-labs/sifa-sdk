/**
 * "Open to" taxonomy. Mirrors `id.sifa.defs#openToWorkStatus.knownValues` from
 * sifa-lexicons. Surfaces a single source of truth for the editor (where the
 * user picks values) and the IdentityCard (where badges are rendered).
 *
 * Shape matches `INDUSTRY_OPTIONS`: `{ value, labelKey }` so consumers can run
 * `labelKey` through their own i18n layer (e.g. next-intl `useTranslations`).
 */

export type OpenToGroup = 'work' | 'mentorship' | 'peer';

export interface OpenToOption {
  value: string;
  labelKey: string;
  token: string;
  group: OpenToGroup;
}

export const OPEN_TO_OPTIONS: OpenToOption[] = [
  {
    value: 'id.sifa.defs#fullTimeRoles',
    labelKey: 'fullTimeRoles',
    token: 'fullTime',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#partTimeRoles',
    labelKey: 'partTimeRoles',
    token: 'partTime',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#contractRoles',
    labelKey: 'contractRoles',
    token: 'contract',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#commissions',
    labelKey: 'commissions',
    token: 'commissions',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#boardPositions',
    labelKey: 'boardPositions',
    token: 'board',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#mentoringOthers',
    labelKey: 'mentoringOthers',
    token: 'mentor',
    group: 'mentorship',
  },
  {
    value: 'id.sifa.defs#beingMentored',
    labelKey: 'beingMentored',
    token: 'mentee',
    group: 'mentorship',
  },
  {
    value: 'id.sifa.defs#collaborations',
    labelKey: 'collaborations',
    token: 'collab',
    group: 'peer',
  },
];

/** Map short token (e.g. "fullTime") -> lex value (e.g. "id.sifa.defs#fullTimeRoles"). */
export const OPEN_TO_TOKEN_TO_VALUE: Record<string, string> = Object.fromEntries(
  OPEN_TO_OPTIONS.map((o) => [o.token, o.value]),
);

/** Map lex value -> short token. */
export const OPEN_TO_VALUE_TO_TOKEN: Record<string, string> = Object.fromEntries(
  OPEN_TO_OPTIONS.map((o) => [o.value, o.token]),
);

/** All valid tokens, useful for runtime validation. */
export const OPEN_TO_TOKENS: readonly string[] = OPEN_TO_OPTIONS.map((o) => o.token);

/** Resolve a token to its lex value, returning `undefined` if unknown. */
export function openToTokenToValue(token: string | undefined | null): string | undefined {
  if (!token) return undefined;
  return OPEN_TO_TOKEN_TO_VALUE[token];
}

/** Resolve a lex value to its token, returning `undefined` if unknown. */
export function openToValueToToken(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return OPEN_TO_VALUE_TO_TOKEN[value];
}

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
