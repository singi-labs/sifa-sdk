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
  /**
   * Literal English label. Canonical for consumers without an i18n layer (the
   * mobile app). Web can keep resolving `labelKey`; the en.json English MUST
   * match this string so the two never drift.
   */
  label: string;
  token: string;
  group: OpenToGroup;
}

export const OPEN_TO_OPTIONS: OpenToOption[] = [
  {
    value: 'id.sifa.defs#fullTimeRoles',
    labelKey: 'fullTimeRoles',
    label: 'Full-time roles',
    token: 'fullTime',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#partTimeRoles',
    labelKey: 'partTimeRoles',
    label: 'Part-time roles',
    token: 'partTime',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#contractRoles',
    labelKey: 'contractRoles',
    label: 'Contract roles',
    token: 'contract',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#commissions',
    labelKey: 'commissions',
    label: 'Commissioned work',
    token: 'commissions',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#boardPositions',
    labelKey: 'boardPositions',
    label: 'Board positions',
    token: 'board',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#speakingEngagements',
    labelKey: 'speakingEngagements',
    label: 'Speaking engagements',
    token: 'speaking',
    group: 'work',
  },
  {
    value: 'id.sifa.defs#mentoringOthers',
    labelKey: 'mentoringOthers',
    label: 'Mentoring others',
    token: 'mentor',
    group: 'mentorship',
  },
  {
    value: 'id.sifa.defs#beingMentored',
    labelKey: 'beingMentored',
    label: 'Being mentored',
    token: 'mentee',
    group: 'mentorship',
  },
  {
    value: 'id.sifa.defs#collaborations',
    labelKey: 'collaborations',
    label: 'Collaborations',
    token: 'collab',
    group: 'peer',
  },
];

/** Map short token -> literal English label (for consumers without i18n). */
export const OPEN_TO_TOKEN_LABELS: Record<string, string> = Object.fromEntries(
  OPEN_TO_OPTIONS.map((o) => [o.token, o.label]),
);

/** Open-to groups in canonical display order, with their literal headers. */
export const OPEN_TO_GROUP_LABELS: Record<OpenToGroup, string> = {
  work: 'Work',
  mentorship: 'Mentorship',
  peer: 'Peer',
};

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

/**
 * Legacy `openToWorkStatus` values mapped to their current canonical value.
 * Mirrors {@link OPEN_TO_LEGACY_ALIASES} but resolves to the full lex value
 * (not just the `labelKey`) so it can rewrite stored records.
 */
export const OPEN_TO_LEGACY_VALUE_ALIASES: Record<string, string> = {
  'id.sifa.defs#mentoring': 'id.sifa.defs#mentoringOthers',
};

/**
 * Normalize a list of `openTo` values: resolve legacy aliases to their
 * canonical value, then dedup while preserving first-seen order. Unknown tokens
 * pass through untouched (forward-compat). Used by the editor (so a legacy token
 * maps onto a real option and migrates forward on save) and by display (so a
 * record carrying both the legacy and canonical token renders a single badge).
 */
export function normalizeOpenTo(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const canonical = OPEN_TO_LEGACY_VALUE_ALIASES[value] ?? value;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}
